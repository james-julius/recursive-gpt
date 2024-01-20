import { ChatCompletionCreateParams } from "openai/resources/chat/index";

export const functions: ChatCompletionCreateParams.Function[] = [
  {
    name: "get_similar_topics",
    description: "Get similar topics based on your current conversation, that you might want to explore",
    parameters: {
      name: "topics",
      type: "object",
      properties: {
        topics: {
          type: "array",
          items: {
            "title": "string",
            "description": "string",
            "starting_prompt_for_topic_conversation": "string"
          }
        }
      },
      required: ["topics"],
    },
  },
  // {
  //   name: "get_story_with_comments",
  //   description:
  //     "Get a story from Hacker News with comments.  Also returns the Hacker News URL to the story and each comment.",
  //   parameters: {
  //     type: "object",
  //     properties: {
  //       id: {
  //         type: "number",
  //         description: "The ID of the story",
  //       },
  //     },
  //     required: ["id"],
  //   },
  // },
];

function get_similar_topics(topics: any) {
  console.log(topics);
}

export async function runFunction(name: string, args: any) {
  switch (name) {
    case "get_similar_topics":
      return get_similar_topics(args);
    default:
      console.log("null")
      return null;
  }
}
