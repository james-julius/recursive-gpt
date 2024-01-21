from pathlib import Path

import numpy as np
import polars as pl
from dotenv import load_dotenv
from fastapi import FastAPI
from openai import OpenAI
from pydantic import BaseModel
from tqdm import tqdm
from usearch.index import Index

load_dotenv()

### Index

df: pl.DataFrame
index: Index


def initialize_index(data_path: Path):
    global df
    df = pl.read_parquet(data_path)

    global index
    index = Index(ndim=len(df["conv_embedding"][0]))

    for conv_id_hash, conv_embedding in tqdm(
        df.select("conv_id_hash", "conv_embedding").iter_rows(), total=len(df)
    ):
        index.add(conv_id_hash, np.array(conv_embedding))
    print("index initialized")


# Initialize index at init time so it is available for the app.
initialize_index(Path("data/app_embeds.parquet"))


def _search_index(query: np.ndarray):
    vector_matches = index.search(query)

    match_ids = pl.Series(
        [m[0] for m in vector_matches.to_list()],
        dtype=pl.Int64,
    )
    df_matches_by_id = {
        r["conv_id_hash"]: r
        for r in df.filter(pl.col.conv_id_hash.is_in(match_ids))
        .drop("conv_embedding")
        .to_dicts()
    }

    return {
        "matches": [
            {
                "id": m[0],
                "distance": m[1],
                "data": df_matches_by_id[m[0]],
            }
            for m in vector_matches.to_list()
        ],
    }


### App

app = FastAPI()

client = OpenAI()


def _get_embedding(text):
    response = client.embeddings.create(input=text, model="text-embedding-ada-002")
    return np.array(response.data[0].embedding)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/some")
async def some():
    assert index is not None, "index not initialized"

    # Search for zero vector to get some arbitrary results back
    return _search_index(np.zeros(index.ndim))


class Query(BaseModel):
    query: str


@app.post("/query")
async def query(query: Query):
    assert index is not None, "index not initialized"

    query_embedding = _get_embedding(query.query)
    return _search_index(query_embedding)
