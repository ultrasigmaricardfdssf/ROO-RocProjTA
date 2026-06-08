export interface QuestionSummary {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
  authorId: number;
  authorName: string;
  tagId: number | null;
  tagName: string | null;
  tagShort: string | null;
  tagColor: string | null;
  replyCount: number;
  viewCount: number,
  reactionCount: number;
}

export interface QuestionDetail extends QuestionSummary {
  editedAt: string | null;
}

export interface Reply {
  id: number;
  content: string;
  createdAt: string;
  isSolution: boolean;
  authorId: number;
  authorName: string;
}

export interface Tag {
  id: number;
  name: string;
  short: string | null;
  color: string | null;
}

async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch("/api" + url, { credentials: "include", ...options });
  const data = await res.json();
  if (!res.ok)
    throw Object.assign(new Error(data.error?.message ?? "Request failed"), {
      code: data.error?.code,
    });
  return data;
}

export function useForums() {
  async function getRecent(limit = 20): Promise<QuestionSummary[]> {
    return apiFetch(`/forums/recent?limit=${limit}`);
  }

  async function getTop(limit = 10): Promise<QuestionSummary[]> {
    return apiFetch(`/forums/top?limit=${limit}`);
  }

  async function getQuestion(id: number): Promise<QuestionDetail> {
    return apiFetch(`/forums/${id}`);
  }

  async function getReplies(questionId: number): Promise<Reply[]> {
    return apiFetch(`/forums/${questionId}/replies`);
  }

  async function getTags(): Promise<Tag[]> {
    return apiFetch("/forums/tags");
  }

  async function postQuestion(data: {
    title: string;
    content?: string;
    tagId?: number;
  }): Promise<QuestionDetail> {
    return apiFetch("/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function postReply(
    questionId: number,
    content: string,
  ): Promise<Reply> {
    return apiFetch(`/forums/${questionId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  }

  async function deleteQuestion(id: number): Promise<void> {
    return apiFetch(`/forums/${id}`, { method: "DELETE" });
  }

  async function deleteReply(replyId: number): Promise<void> {
    return apiFetch(`/forums/replies/${replyId}`, { method: "DELETE" });
  }

  async function setSolution(
    questionId: number,
    replyId: number | null,
  ): Promise<void> {
    return apiFetch(`/forums/${questionId}/solution`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replyId }),
    });
  }

  async function reactToQuestion(id: number): Promise<{ liked: boolean; reactionCount: number }> {
    return apiFetch(`/forums/${id}/react`, { method: "POST" });
  }

  async function reactToReply(replyId: number): Promise<{ liked: boolean; reactionCount: number }> {
    return apiFetch(`/forums/replies/${replyId}/react`, { method: "POST" });
  }

  return {
    getRecent,
    getTop,
    getQuestion,
    getReplies,
    getTags,
    postQuestion,
    postReply,
    deleteQuestion,
    deleteReply,
    setSolution,
    reactToQuestion,
    reactToReply
  };
}
