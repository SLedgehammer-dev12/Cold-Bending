import type { Plugin } from "@opencode-ai/plugin"

export default (async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const tool = (output as { tool?: string }).tool ?? (input as { tool?: string }).tool
      if (tool === "edit" || tool === "write") {
        console.log("[coldbend-loop-guard] edit/write invoked — ensure question-tool approval was obtained for this loop iteration.")
      }
    },
  }
}) satisfies Plugin
