import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { ApiState, AssessmentQuestion, AssessmentSubmission } from "@/components/platform/types";

type ApiFetch = <T>(path: string, init?: RequestInit, token?: string) => Promise<T>;

type UseAssessmentActionsParams = {
  state: ApiState;
  setState: Dispatch<SetStateAction<ApiState>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string>>;
  apiFetch: ApiFetch;
};

export function useAssessmentActions({ state, setState, setLoading, setMessage, apiFetch }: UseAssessmentActionsParams) {
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});

  async function loadAssessmentQuestions() {
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch<{ questions: AssessmentQuestion[] }>("/assessment/questions");
      setState((current) => ({
        ...current,
        assessmentQuestions: data.questions
      }));
      setAssessmentAnswers((current) => {
        const next = { ...current };
        for (const question of data.questions) {
          if (next[question.id] === undefined) {
            next[question.id] = 0;
          }
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载测评题目失败");
    } finally {
      setLoading(false);
    }
  }

  async function loadAssessmentSubmissions(token = state.token) {
    if (!token) {
      return;
    }
    const data = await apiFetch<{ submissions: AssessmentSubmission[] }>("/assessment/submissions", {}, token);
    setState((current) => ({
      ...current,
      assessmentSubmissions: data.submissions,
      latestAssessment: data.submissions[0] ?? current.latestAssessment
    }));
  }

  async function submitAssessment() {
    if (!state.token) {
      setMessage("请先登录");
      return;
    }
    if (state.assessmentQuestions.length === 0) {
      setMessage("暂无测评题目");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const answers = state.assessmentQuestions.map((question) => ({
        question_id: question.id,
        score: assessmentAnswers[question.id] ?? 0
      }));
      const data = await apiFetch<{ submission: AssessmentSubmission }>("/assessment/submissions", {
        method: "POST",
        body: JSON.stringify({ answers })
      });
      setState((current) => ({
        ...current,
        latestAssessment: data.submission,
        assessmentSubmissions: [data.submission, ...current.assessmentSubmissions]
      }));
      setMessage("测评已提交");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "提交测评失败");
    } finally {
      setLoading(false);
    }
  }

  return {
    assessmentAnswers,
    setAssessmentAnswers,
    loadAssessmentQuestions,
    loadAssessmentSubmissions,
    submitAssessment
  };
}
