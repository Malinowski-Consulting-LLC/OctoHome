"use client";

import { useSession } from "next-auth/react";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import Sidebar from "@/components/sidebar";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createTask } from "@/lib/github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  label: z.string().min(1, "Please select a label"),
  description: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const DEFAULT_LABELS = ["Groceries", "Bills", "Maintenance", "School", "Health", "Urgent"];

export default function NewTaskPage() {
  const { data: session } = useSession();
  const { repoOwner, repoName } = useOnboardingStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      label: "Maintenance",
    },
  });

  const selectedLabel = watch("label");

  const onSubmit = async (values: TaskFormValues) => {
    if (session?.accessToken && repoOwner && repoName) {
      const token = session.accessToken;
      setIsSubmitting(true);
      try {
        await createTask(
          token,
          repoOwner,
          repoName,
          values.title,
          values.description || "Created via OctoHome",
          [values.label]
        );
        router.push("/tasks");
      } catch (error) {
        console.error(error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-12 overflow-y-auto">
        <Link href="/tasks" className="inline-flex items-center gap-2 text-2xl font-black uppercase mb-8 hover:underline">
          <ArrowLeft className="w-6 h-6" /> Back to List
        </Link>

        <h1 className="text-6xl font-black uppercase tracking-tighter mb-12">New Household Task</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-12">
          <div className="space-y-4">
            <label className="text-3xl font-black uppercase block">What needs doing?</label>
            <Input 
              {...register("title")}
              placeholder="e.g. Change air filters"
              className={errors.title ? "border-red-600" : ""}
            />
            {errors.title && <p className="text-red-600 font-bold text-xl uppercase">{errors.title.message}</p>}
          </div>

          <div className="space-y-4">
            <label className="text-3xl font-black uppercase block">Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DEFAULT_LABELS.map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setValue("label", l)}
                  className={`p-6 border-4 font-black uppercase text-xl transition-all ${
                    selectedLabel === l ? "bg-black text-white border-black" : "border-zinc-200 hover:border-black"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-3xl font-black uppercase block">Extra Details (Optional)</label>
            <textarea 
              {...register("description")}
              className="w-full h-48 p-6 text-xl border-4 border-black font-bold focus:ring-4 focus:ring-accent outline-none"
              placeholder="Add any specific instructions or notes..."
            />
          </div>

          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className="w-full h-24 text-3xl font-black border-8 border-black"
          >
            {isSubmitting ? <Loader2 className="w-10 h-10 animate-spin mr-4" /> : <Save className="w-10 h-10 mr-4" />}
            SAVE TASK
          </Button>
        </form>
      </main>
    </div>
  );
}
