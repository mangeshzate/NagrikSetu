"use client";

import React, { useState } from "react";
import { MissingFieldRequirement } from "@/types/eligibility";
import { useLanguage } from "@/lib/i18n/context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { HelpCircle } from "lucide-react";

export interface DynamicQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: MissingFieldRequirement[];
  onSubmitAnswers: (answers: Record<string, any>) => Promise<void>;
}

export const DynamicQuestionsModal: React.FC<DynamicQuestionsModalProps> = ({
  isOpen,
  onClose,
  missingFields,
  onSubmitAnswers,
}) => {
  const { language } = useLanguage();
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (fieldKey: string, val: any) => {
    setFormValues((prev) => ({ ...prev, [fieldKey]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitAnswers(formValues);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={language === "mr" ? "अतिरिक्त माहिती आवश्यक" : "Additional Verification Details"}
      description={
        language === "mr"
          ? "या योजनेची पात्रता पूर्णपणे तपासण्यासाठी खालील माहिती भरा. ही माहिती तुमच्या प्रोफाइलमध्ये जतन केली जाईल."
          : "Please provide the following details to evaluate all eligibility rules for this opportunity."
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {missingFields.map((field) => {
          const label = language === "mr" ? field.labelMr : field.labelEn;

          if (field.type === "number") {
            return (
              <Input
                key={field.fieldKey}
                label={label}
                type="number"
                step="any"
                required
                placeholder={field.placeholder || "0"}
                value={formValues[field.fieldKey] || ""}
                onChange={(e) => handleChange(field.fieldKey, parseFloat(e.target.value))}
              />
            );
          }

          if (field.type === "select" && field.options) {
            return (
              <Select
                key={field.fieldKey}
                label={label}
                required
                value={formValues[field.fieldKey] || ""}
                onChange={(e) => handleChange(field.fieldKey, e.target.value)}
              >
                <option value="">
                  {language === "mr" ? "-- निवडा --" : "-- Select option --"}
                </option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {language === "mr" ? opt.labelMr : opt.labelEn}
                  </option>
                ))}
              </Select>
            );
          }

          if (field.type === "boolean") {
            return (
              <div key={field.fieldKey} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  {label}
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name={field.fieldKey}
                      value="true"
                      checked={formValues[field.fieldKey] === true}
                      onChange={() => handleChange(field.fieldKey, true)}
                      className="text-civic-600 focus:ring-civic-500"
                    />
                    <span>{language === "mr" ? "होय (Yes)" : "Yes"}</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name={field.fieldKey}
                      value="false"
                      checked={formValues[field.fieldKey] === false}
                      onChange={() => handleChange(field.fieldKey, false)}
                      className="text-civic-600 focus:ring-civic-500"
                    />
                    <span>{language === "mr" ? "नाही (No)" : "No"}</span>
                  </label>
                </div>
              </div>
            );
          }

          // Fallback text input
          return (
            <Input
              key={field.fieldKey}
              label={label}
              type="text"
              required
              placeholder={field.placeholder || ""}
              value={formValues[field.fieldKey] || ""}
              onChange={(e) => handleChange(field.fieldKey, e.target.value)}
            />
          );
        })}

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {language === "mr" ? "रद्द करा" : "Cancel"}
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {language === "mr" ? "माहिती जतन करा व तपासा" : "Save & Re-evaluate"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
