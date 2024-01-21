"use client";

import { useRef, useState } from "react";
import { useChat, Message } from "ai/react";
import va from "@vercel/analytics";
import clsx from "clsx";
import { LoadingCircle, SendIcon } from "./icons";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Textarea from "react-textarea-autosize";
import { toast } from "sonner";

const examples = [
  "What is the deepest point of the ocean?",
  "What are the biggest barriers in space exploration?",
  "How do I get started learning AI?",
];

export default function Chat() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [similarTopics, setSimilarTopics] = useState({});
  const [similarChats, setSimilarChats] = useState({});

  const { messages, input, setInput, setMessages, handleSubmit, isLoading } =
    useChat({
      onResponse: (response) => {
        if (response.status === 429) {
          toast.error("You have reached your request limit for the day.");
          va.track("Rate limited");
          return;
        } else {
          va.track("Chat initiated");
        }
      },
      onFinish: (response) => {
        console.log("onFinish()");
        console.log(response);
        fetchSimilarTopics(response.content);
        fetchSimilarChats(response.content);
      },
      onError: (error) => {
        va.track("Chat errored", {
          input,
          error: error.message,
        });
      },
    });

  const setChatMessages = (e: any, chat: any) => {
    console.log(messages);
    const new_messages = chat.data.conversation.map((c, index) => {
      c.id = index;
      return c;
    });
    const all_messages = messages.concat(new_messages);
    console.log(all_messages);
    setMessages(all_messages);
    setInput("Tell me more about this topic");
    handleSubmit(e);
  };

  const setTopicMessages = (e: any, topic: any) => {
    setInput(topic.description);
    handleSubmit(e);
  };

  const fetchSimilarTopics = async (content: string) => {
    const body = JSON.stringify({ prevResponse: content });
    const res = await fetch("/api/similar_topics", {
      method: "POST",
      body,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("similar topics res");
        console.log(data);
        setSimilarTopics({
          ...data,
        });
      })
      .catch((e) => console.error(e));
    console.log(res);
  };

  const fetchSimilarChats = async (content: string) => {
    const body = JSON.stringify({ query: JSON.stringify(content) });
    const res = await fetch("/api/similar_chats", {
      method: "POST",
      body,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("similar chats res");
        console.log(data);
        setSimilarChats({
          ...data,
        });
      })
      .catch((e) => console.error(e));
    console.log(res);
  };

  const disabled = isLoading || input.length === 0;

  return (
    <div className="flex h-full">
      {/* Similar Chats Section */}
      <aside className="hidden border-r border-gray-200 bg-gray-50 p-5 lg:block lg:w-1/4">
        <h2 className="mb-4 text-lg font-semibold">Similar Chats</h2>
        {similarChats.matches &&
          similarChats.matches.map((chat, index) => (
            <div key={index} className="mb-2">
              <button
                className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
                onClick={(e) => setChatMessages(e, chat)}
              >
                {/* Adjust how you want to display each chat item */}
                <ul>
                  {chat.data.conversation.slice(0, 2).map((message, i) => (
                    <li key={i}>
                      {i == 0 ? (
                        <b>{message.content}</b>
                      ) : (
                        <em>{message.content}</em>
                      )}
                    </li>
                  ))}
                </ul>
              </button>
            </div>
          ))}
      </aside>

      <main className="flex w-full flex-col items-center justify-between pb-40 lg:w-3/4">
        {/* <main className="flex flex-col items-center justify-between pb-40"> */}

        {/* <div className="absolute top-5 hidden w-full justify-between px-5 sm:flex"/> */}
        <div className="flex w-full">
          {/* Main Chat Section */}
          <main className="flex flex-grow flex-col items-center justify-between pb-40">
            {/* ... existing main chat content ... */}
            {messages.length > 0 ? (
              messages.map((message, i) => (
                <div
                  key={i}
                  className={clsx(
                    "flex w-full items-center justify-center border-b border-gray-200 py-8",
                    message.role === "user" ? "bg-white" : "bg-gray-100",
                  )}
                >
                  <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
                    <div
                      className={clsx(
                        "p-1.5 text-white",
                        message.role === "assistant"
                          ? "bg-green-500"
                          : "bg-black",
                      )}
                    >
                      {message.role === "user" ? (
                        <User width={20} />
                      ) : (
                        <Bot width={20} />
                      )}
                    </div>
                    <ReactMarkdown
                      className="prose mt-1 w-full break-words prose-p:leading-relaxed"
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // open links in new tab
                        a: (props) => (
                          <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))
            ) : (
              // No messages entered yet
              <div className="border-gray-200sm:mx-0 mx-5 mt-20 max-w-screen-md rounded-md border sm:w-full">
                <div className="flex flex-col space-y-4 p-7 sm:p-10">
                  <h1 className="text-center text-lg font-semibold text-black">
                    Welcome to RecursiveGPT!
                  </h1>
                  <p className="text-center text-gray-500">
                    This is an{" "}
                    <a
                      href="https://github.com/james-julius/recursive-gpt"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline underline-offset-4 transition-colors hover:text-black"
                    >
                      open-source
                    </a>{" "}
                    AI chatbot that allows you to converse with ChatGPT while
                    viewing adjacent topics, so you can see just how deep the
                    LLM rabbithole goes.
                  </p>
                </div>
                <div className="flex flex-col space-y-4 border-t border-gray-200 bg-gray-50 p-7 sm:p-10">
                  {examples.map((example, i) => (
                    <button
                      key={i}
                      className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
                      onClick={() => {
                        setInput(example);
                        inputRef.current?.focus();
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Always displayed */}
        <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3 bg-gradient-to-b from-transparent via-gray-100 to-gray-100 p-5 pb-3 sm:px-0">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative w-full max-w-screen-md rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4"
          >
            <Textarea
              ref={inputRef}
              tabIndex={0}
              required
              rows={1}
              autoFocus
              placeholder="Send a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  formRef.current?.requestSubmit();
                  e.preventDefault();
                }
              }}
              spellCheck={false}
              className="w-full pr-10 focus:outline-none"
            />
            <button
              className={clsx(
                "absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all",
                disabled
                  ? "cursor-not-allowed bg-white"
                  : "bg-green-500 hover:bg-green-600",
              )}
              disabled={disabled}
            >
              {isLoading ? (
                <LoadingCircle />
              ) : (
                <SendIcon
                  className={clsx(
                    "h-4 w-4",
                    input.length === 0 ? "text-gray-300" : "text-white",
                  )}
                />
              )}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400">
            Built with{" "}
            <a
              href="https://platform.openai.com/docs/guides/gpt/function-calling"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-black"
            >
              OpenAI Functions
            </a>{" "}
            and{" "}
            <a
              href="https://sdk.vercel.ai/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-black"
            >
              Vercel AI SDK
            </a>
          </p>
        </div>
      </main>

      {/* Sidebar for Additional Prompts */}
      <aside className="hidden w-1/4 flex-col space-y-4 border-l border-gray-200 bg-gray-50 p-7 lg:flex">
        <h2 className="mb-4 text-lg font-semibold">Similar Topics</h2>
        {similarTopics.topics &&
          similarTopics.topics.map((topic, i) => (
            <button
              key={i}
              className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
              onClick={(e) => setTopicMessages(e, topic)}
            >
              <div>
                <b>{topic.title}</b>
              </div>
              <div>{topic.description}</div>
            </button>
          ))}
      </aside>
    </div>
  );
}
