import { z } from "zod"
import { getCompletion } from "./ai/index"

const responseTemplate = `
## AI Gladiator Combat Prompt

### **Task:**
You will receive the **stats of two gladiators**, and you must define their attacks based on the following rules:

1. **Analyze each gladiator's stats** (strength, agility, equipment, etc.).
2. **Determine the best attack strategy** for each fighter.
3. **Consider arena hazards and visibility conditions**.
4. **Factor in the impact of their equipment**.
5. **Assess the tutor's tip but ignore it if it is unrealistic or misleading**.

---

### **User Input Placeholder**
{{USER_MESSAGE}}

---

### **Expected JSON Output Format**
Using the provided stats and context, extract the following details:
- **Gladiator 1 stats**
- **Gladiator 2 stats**
- **Gladiator 1 tutor's tip** (if provided)
- **Gladiator 2 tutor's tip** (if provided)

Based on this information, **define the most effective attack for each gladiator**.

#### **Response Format (Strictly a Valid JSON Object)**
\`\`\`json
{
  "action1": "I feint right, then pivot to slam my shield into his ribs, forcing him off-balance. As he stumbles, I thrust my gladius into his exposed side, aiming to cripple his movement.",
  "action2": "I use my agility to circle Titan, feinting high with my sword to draw his guard up. As he reacts, I sweep low, aiming to trip him on the loose sand, then thrust my gladius toward his exposed side."
}
\`\`\`

---

### **Response Rules:**
- The response **must be a single, valid JSON object**.
- Do **not** include explanations or extra text—only the JSON response.
- **Tutor's tip should be considered only if relevant**. Ignore it if it suggests an impractical or misleading strategy.
- Ensure **logical and strategic attack choices** based on the given stats and arena conditions.

`

export async function getGladiatorResult(prompt: { text: string}) {
  console.log(prompt)
  const responseSchema = z.object({
    action1: z.string(),
    action2: z.string(),
  })

  let response = {
    error: null,
    data: null
  }

  let retries = 3

  do {
    const completion = await getCompletion(prompt.text, "meta-llama/Llama-3.3-70B-Instruct", responseTemplate)

    if (completion?.choices[0] === undefined) {
      retries -= 1
      continue
    }

    const mes = completion.choices[0].message;
    try {
      let correctMessage = mes.content.replace(/```json\n?/, '').replace(/```/, '').trim();

      const text = JSON.parse(correctMessage)

      const valid = responseSchema.safeParse(text)

      if (!valid.success) {
        throw new Error("Could not parse data")
      }

      response = {
        data: text,
        error: null
      }

      retries = 0

    } catch (e) {
      retries -= 1
      continue
    }
  } while (retries > 0)

  return response
}

