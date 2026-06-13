"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import DarkButton from "./marketing/DarkButton";

type ConsultationFormData = {
  name: string;
  email: string;
  phone: string;
  businessType: string;
  businessSize: string;
  preferredDate: string;
  preferredTime: string;
  meetingType: string;
  challenges: string;
  smsConsent?: boolean;
};

const fieldClass =
  "w-full rounded-lg border border-stroke-1 bg-surface-3 px-4 py-3 text-ink-0 placeholder:text-ink-3 transition-colors focus:border-aqua focus:outline-none";
const labelClass = "mb-2 block text-sm font-semibold text-ink-1";
const errorClass = "mt-1 text-sm text-signal-danger";

export default function ConsultationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultationFormData>();

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit consultation request");
      }

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
        <label htmlFor="name" className={labelClass}>
          Full Name *
        </label>
        <input
          id="name"
          type="text"
          {...register("name", { required: "Name is required" })}
          className={fieldClass}
          placeholder="John Smith"
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={labelClass}>
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
          className={fieldClass}
          placeholder="john@business.com"
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone Number *
        </label>
        <input
          id="phone"
          type="tel"
          {...register("phone", { required: "Phone number is required" })}
          className={fieldClass}
          placeholder="(555) 123-4567"
        />
        {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
      </div>

      {/* Business Type */}
      <div>
        <label htmlFor="businessType" className={labelClass}>
          Business Type *
        </label>
        <select
          id="businessType"
          {...register("businessType", { required: "Please select your business type" })}
          className={fieldClass}
        >
          <option value="">Select your industry...</option>
          <option value="retail">Retail</option>
          <option value="restaurant">Restaurant/Food Service</option>
          <option value="professional">Professional Services</option>
          <option value="healthcare">Healthcare</option>
          <option value="ecommerce">E-commerce</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="other">Other</option>
        </select>
        {errors.businessType && <p className={errorClass}>{errors.businessType.message}</p>}
      </div>

      {/* Business Size */}
      <div>
        <label htmlFor="businessSize" className={labelClass}>
          Business Size *
        </label>
        <select
          id="businessSize"
          {...register("businessSize", { required: "Please select your business size" })}
          className={fieldClass}
        >
          <option value="">Select size...</option>
          <option value="1-5">1-5 employees</option>
          <option value="6-20">6-20 employees</option>
          <option value="21-50">21-50 employees</option>
          <option value="51+">51+ employees</option>
        </select>
        {errors.businessSize && <p className={errorClass}>{errors.businessSize.message}</p>}
      </div>

      {/* Meeting Type */}
      <div>
        <label className={labelClass}>Meeting Preference *</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="virtual"
              {...register("meetingType", { required: "Please select a meeting type" })}
              className="mr-3 accent-aqua focus:ring-aqua"
            />
            <span className="text-ink-1">Virtual (Video Call)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="in-person"
              {...register("meetingType", { required: "Please select a meeting type" })}
              className="mr-3 accent-aqua focus:ring-aqua"
            />
            <span className="text-ink-1">In-Person</span>
          </label>
        </div>
        {errors.meetingType && <p className={errorClass}>{errors.meetingType.message}</p>}
      </div>

      {/* Preferred Date */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="preferredDate" className={labelClass}>
            Preferred Date *
          </label>
          <input
            id="preferredDate"
            type="date"
            {...register("preferredDate", { required: "Please select a date" })}
            className={`${fieldClass} [color-scheme:dark]`}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.preferredDate && <p className={errorClass}>{errors.preferredDate.message}</p>}
        </div>

        {/* Preferred Time */}
        <div>
          <label htmlFor="preferredTime" className={labelClass}>
            Preferred Time *
          </label>
          <select
            id="preferredTime"
            {...register("preferredTime", { required: "Please select a time" })}
            className={fieldClass}
          >
            <option value="">Select time...</option>
            <option value="9:00 AM">9:00 AM</option>
            <option value="10:00 AM">10:00 AM</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="1:00 PM">1:00 PM</option>
            <option value="2:00 PM">2:00 PM</option>
            <option value="3:00 PM">3:00 PM</option>
            <option value="4:00 PM">4:00 PM</option>
          </select>
          {errors.preferredTime && <p className={errorClass}>{errors.preferredTime.message}</p>}
        </div>
      </div>

      {/* Challenges */}
      <div>
        <label htmlFor="challenges" className={labelClass}>
          What challenges are you facing? *
        </label>
        <textarea
          id="challenges"
          {...register("challenges", { required: "Please describe your challenges" })}
          rows={4}
          className={`${fieldClass} resize-none`}
          placeholder="Tell us about the friction points in your business that you'd like AI to help solve..."
        />
        {errors.challenges && <p className={errorClass}>{errors.challenges.message}</p>}
      </div>

      {/* SMS Consent */}
      <div className="flex items-start gap-3">
        <input
          id="smsConsent"
          type="checkbox"
          {...register("smsConsent")}
          className="mt-1 h-4 w-4 rounded border-stroke-1 bg-surface-3 accent-aqua focus:ring-aqua"
        />
        <label htmlFor="smsConsent" className="text-sm text-ink-2">
          I consent to receive SMS replies from Novique.AI when I text with questions or scheduling requests. Reply STOP to opt out. Standard message rates may apply.
        </label>
      </div>

      {/* Submit Button */}
      <div>
        <DarkButton type="submit" size="lg" className="w-full">
          {isSubmitting ? "Booking..." : "Book My Free Consultation"}
        </DarkButton>
      </div>

      {/* Status Messages */}
      {submitStatus === "success" && (
        <div className="rounded-lg border border-signal-success/40 bg-signal-success/10 p-4">
          <p className="mb-2 font-semibold text-signal-success">
            ✓ Consultation Booked Successfully!
          </p>
          <p className="text-ink-1">
            We&apos;ll send you a confirmation email shortly and reach out within 24 hours
            to confirm your preferred time slot.
          </p>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="rounded-lg border border-signal-danger/40 bg-signal-danger/10 p-4">
          <p className="font-semibold text-signal-danger">
            ✗ Something went wrong. Please try again or call us at (555) 123-4567.
          </p>
        </div>
      )}

      {/* Privacy Note */}
      <p className="text-center text-sm text-ink-2">
        By submitting this form, you agree to our{" "}
        <a href="/privacy" className="text-link hover:text-link-hover">
          Privacy Policy
        </a>
        . We&apos;ll never share your information.
      </p>
    </form>
  );
}
