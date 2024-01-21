import { kv } from "@vercel/kv";
import { Ratelimit } from "@upstash/ratelimit";
import { OpenAI } from "openai";

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  console.log(req)
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(
      `chathn_ratelimit_${ip}`,
    );

    if (!success) {
      return new Response("You have reached your request limit for the day.", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  const { message } = await req.json();

  const similarTopics = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    messages: [{
      role: 'user',
      content: `Give me a list of similar topics in a current ai conversation where the last message was: ${message}`
    },
      {
        role: 'assistant to=json',
        content: `[
          {"title": "Topic 1", "description": "Description 1", "starting_prompt": "Prompt 1"},
          {"title": "Topic 2", "description": "Description 2", "starting_prompt": "Prompt 2"},
          {"title": "Topic 3", "description": "Description 3", "starting_prompt": "Prompt 3"}
        ]`
    }],
    response_format: { type: "json_object"},
  });

  console.log('similarTopics')
  console.log(JSON.stringify(similarTopics))
  return new Response(JSON.stringify(similarTopics))
}
