import type { QuestionSummary, Tag } from '@/composables/useForums'
import { type Ref } from 'vue';

export interface TopicCardShape {
  id: string
  title: string
  preview: string
  authorName: string
  postedAgo: string
  views: number
  tags: string[]
  replyCount: number
  tagColor: string | null
}

export function useTopicUtils(tags: Ref<Tag[]>) {
  function timeAgo(dateStr: string): string {
    if (!dateStr) return ''
    const diff  = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    const weeks = Math.floor(days / 7)
    if (mins  < 1)  return 'just now'
    if (mins  < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days  < 7)  return `${days}d ago`
    return `${weeks}w ago`
  }

  function toTopicCard(q: QuestionSummary): TopicCardShape {
    return {
      id:         String(q.id),
      title:      q.title,
      preview:    q.content ?? '',
      authorName: q.authorName ?? 'Unknown',
      postedAgo:  timeAgo(q.createdAt),
      views:      q.viewCount ?? q.reactionCount ?? 0,
      tags:       q.tagShort ? [q.tagShort] : [],
      replyCount: q.replyCount ?? 0,
      tagColor:   q.tagColor ?? null,
    }
  }

  function tagIdByShort(short: string) {
    return tags.value.find(t => t.short === short || t.name === short)?.id
  }
  function tagSearchRoute(short: string) {
    const id = tagIdByShort(short)
    return id ? { path: '/search', query: { tagId: String(id) } } : { path: '/search' }
  }

  return { timeAgo, toTopicCard, tagIdByShort, tagSearchRoute }
}