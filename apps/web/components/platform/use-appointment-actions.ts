import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { apiFetchJson } from "@/components/platform/api";
import { statusText } from "@/components/platform/types";
import type { ApiState, Appointment } from "@/components/platform/types";

type ApiFetch = <T>(path: string, init?: RequestInit, token?: string) => Promise<T>;

type UseAppointmentActionsParams = {
  state: ApiState;
  setState: Dispatch<SetStateAction<ApiState>>;
  canManageAppointments: boolean;
  selectedCounselor: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string>>;
  apiFetch: ApiFetch;
};

export function useAppointmentActions({
  state,
  setState,
  canManageAppointments,
  selectedCounselor,
  setLoading,
  setMessage,
  apiFetch
}: UseAppointmentActionsParams) {
  const [scheduledAt, setScheduledAt] = useState("2026-07-05T14:00");
  const [content, setContent] = useState("最近睡眠不好，想预约咨询。");

  async function loadAppointments(token = state.token) {
    if (!token) {
      return;
    }
    const data = await apiFetchJson<{ appointments?: Appointment[] }>("/appointments", {}, token, "加载预约失败");
    setState((current) => ({
      ...current,
      appointments: data.appointments ?? []
    }));
  }

  async function createAppointment() {
    if (!state.token) {
      setMessage("请先登录");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch("/appointments", {
        method: "POST",
        body: JSON.stringify({
          counselor_id: selectedCounselor,
          scheduled_at: new Date(scheduledAt).toISOString(),
          content
        })
      });
      await loadAppointments();
      setMessage("预约已提交");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "预约失败");
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointmentStatus(id: string, status: string) {
    if (!state.token || !canManageAppointments) {
      setMessage("需要管理员或咨询师账号");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadAppointments();
      setMessage(`预约状态已更新为：${statusText[status] ?? status}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新预约状态失败");
    } finally {
      setLoading(false);
    }
  }

  return {
    scheduledAt,
    setScheduledAt,
    content,
    setContent,
    loadAppointments,
    createAppointment,
    updateAppointmentStatus
  };
}
