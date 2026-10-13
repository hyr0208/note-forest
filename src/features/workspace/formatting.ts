export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(new Date(value))

export const notePreview = (value: string) =>
  value.replace(/[#>*_`~-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 72) || '내용을 적어보세요…'
