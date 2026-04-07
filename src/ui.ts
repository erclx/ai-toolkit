import {
  cancel,
  confirm as clackConfirm,
  select as clackSelect,
  intro,
  isCancel,
  outro,
} from '@clack/prompts'

export { intro, outro }

function handleCancel(value: unknown): asserts value is never {
  cancel('Cancelled.')
  process.exit(1)
}

export async function select<Value>(opts: {
  message: string
  options: { value: Value; label: string; hint?: string }[]
}): Promise<Value> {
  const result = await clackSelect(opts)
  if (isCancel(result)) handleCancel(result)
  return result
}

export async function confirm(opts: {
  message: string
  active?: string
  inactive?: string
}): Promise<boolean> {
  const result = await clackConfirm(opts)
  if (isCancel(result)) handleCancel(result)
  return result
}
