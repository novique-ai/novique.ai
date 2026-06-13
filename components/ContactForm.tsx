"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import DarkButton from "@/components/marketing/DarkButton";

type ContactFormData = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  smsConsent?: boolean;
};

const inputClass =
  "w-full rounded-lg border border-stroke-1 bg-surface-3 px-4 py-3 text-ink-0 placeholder:text-ink-3 transition-colors focus:border-aqua focus:outline-none";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: Integrate with EmailJS or your backend API
      // For now, just simulate a submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Form data:", data);
      setSubmitStatus("success");
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink-1">
          Name *
        </label>
        <input
          id="name"
          type="text"
          {...register("name", { required: "Name is required" })}
          className={inputClass}
          placeholder="Your full name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-signal-danger">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink-1">
          Email *
        </label>
        <input
          id="email"
          type="email"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          })}
          className={inputClass}
          placeholder="your@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-signal-danger">{errors.email.message}</p>
        )}
      </div>

      {/* Phone (Optional) */}
      <div>
        <label htmlFor="phone" className="mb-2 block text-sm font-medium text-ink-1">
          Phone (Optional)
        </label>
        <input
          id="phone"
          type="tel"
          {...register("phone")}
          className={inputClass}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Company (Optional) */}
      <div>
        <label htmlFor="company" className="mb-2 block text-sm font-medium text-ink-1">
          Company (Optional)
        </label>
        <input
          id="company"
          type="text"
          {...register("company")}
          className={inputClass}
          placeholder="Your business name"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-ink-1">
          Message *
        </label>
        <textarea
          id="message"
          {...register("message", { required: "Message is required" })}
          rows={5}
          className={`${inputClass} resize-none`}
          placeholder="Tell us about your business and what you need help with..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-signal-danger">{errors.message.message}</p>
        )}
      </div>

      {/* SMS Consent */}
      <div className="flex items-start gap-3">
        <input
          id="smsConsent"
          type="checkbox"
          {...register("smsConsent")}
          className="mt-1 h-4 w-4 rounded border-stroke-1 bg-surface-3 text-aqua accent-aqua focus:ring-aqua"
        />
        <label htmlFor="smsConsent" className="text-sm text-ink-2">
          I consent to receive SMS replies from Novique.AI when I text with questions or scheduling requests. Reply STOP to opt out. Standard message rates may apply.
        </label>
      </div>

      {/* Submit Button */}
      <div>
        <DarkButton type="submit" size="lg" className="w-full">
          {isSubmitting ? "Sending..." : "Send Message"}
        </DarkButton>
      </div>

      {/* Status Messages */}
      {submitStatus === "success" && (
        <div className="rounded-lg border border-stroke-1 bg-surface-2 p-4">
          <p className="font-medium text-signal-success">
            ✓ Message sent successfully! We&apos;ll get back to you within 24 hours.
          </p>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="rounded-lg border border-stroke-1 bg-surface-2 p-4">
          <p className="font-medium text-signal-danger">
            ✗ Something went wrong. Please try again or email us directly.
          </p>
        </div>
      )}
    </form>
  );
}
