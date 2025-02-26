"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useConfettiContext } from "@/context/confetti";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { addSnippetAction } from "../../_actions/snippet";
import LanguageDropDown from "./language-dropdown";

const formDataSchema = z.object({
  codeLanguage: z
    .string({
      required_error: "Please select a language",
    })
    .nonempty(),
  codeSnippet: z
    .string({
      required_error: "Please enter a code snippet",
    })
    .min(30, "Code snippet must be at least 30 characters long"),
});

type FormData = z.infer<typeof formDataSchema>;

export default function AddSnippetForm({}) {
  const { toast } = useToast();
  const confettiCtx = useConfettiContext();

  const form = useForm<FormData>({
    resolver: zodResolver(formDataSchema),
    mode: "onSubmit",
  });

  async function onSubmit(data: FormData) {
    // error handling if prisma upload fails
    await addSnippetAction({
      language: data.codeLanguage,
      code: data.codeSnippet,
    })
      .then((res) => {
        if (res.validationError) {
          toast({
            title: "Error!",
            description:
              "Something went wrong! " +
              (res.validationError.code ?? "") +
              "\n" +
              (res.validationError.language ?? ""),
            duration: 5000,
            style: {
              background: "hsl(var(--destructive))",
            },
          });
          return;
        }

        if (res?.data?.message === "snippet-created-and-achievement-unlocked") {
          toast({
            title: "Achievement Unlocked",
            description: "Uploaded First Snippet",
          });
          confettiCtx.showConfetti();
        }

        toast({
          title: "Success!",
          description: "Snippet added successfully",
          duration: 5000,
          variant: "middle",
          action: (
            <Link
              href="/race"
              className={buttonVariants({ variant: "outline" })}
            >
              Click to Race
            </Link>
          ),
        });
        // this is bugged, idk why it doesn't reset the textarea
        // TODO: fix this
        // form.reset();
      })
      .catch((err) => {
        toast({
          title: "Error!",
          description: "Something went wrong!" + err.message,
          duration: 5000,
          style: {
            background: "hsl(var(--destructive))",
          },
        });
      });
    // console.log("language: ", codeLanguage);
    // console.log("snippet: ", codeSnippet);
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-3 mt-5"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="codeLanguage"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>Language</FormLabel>
              <FormControl>
                <LanguageDropDown
                  codeLanguage={field.value}
                  // TODO: Refactor this component's props.
                  //@ts-expect-error type mismatch
                  setCodeLanguage={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="codeSnippet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code Snippet</FormLabel>
              <FormControl>
                <Textarea
                  rows={8}
                  className="w-full p-2 border"
                  placeholder="Type your custom code here... Minimum 30 characters required."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-fit" type="submit">
          Upload
        </Button>
      </form>
    </Form>
  );
}
