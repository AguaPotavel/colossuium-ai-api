import { z } from "zod"
import { getCompletion } from "./ai/index"

const responseTemplate = ` 
## AI Combat Analysis Prompt

### **Task:**
Analyze the **combatants' CURRENT CONDITION** to determine:
1. **Action viability** (consider stamina and agility)
2. **Damage calculation** (strength vs defense)
3. **Secondary effects** (e.g., bleeding, exhaustion)
4. **Crowd reaction impact** (integrity modifier)

Also, consider environmental factors:
- **Arena hazards**
- **Visibility conditions**
- **Equipment status**

---
### **User Input Placeholder**
{{USER_MESSAGE}}
---

### **Expected JSON Output Format**
Using the provided stats and recent actions, extract the following details:
- **gladiator_1 stats**
- **gladiator_2 stats**
- **gladiator_1 and gladiator_2 intended actions**
- **What happened previously**

Based on this information, **simulate the round's outcome** and update the gladiators stats **according to the narrative result**.

#### **Response Format (Strictly a Valid JSON Object)**
\`\`\`json
{
  "gladiator_1": {
    "stats": { /* Updated stats based on the fight's result */ },
    "name": "string",
    "status_effects": [ /* Status effects like "bleeding", "exhaustion" */ ]
  },
  "gladiator_2": {
    "stats": { /* Updated stats based on the fight's result */ },
    "name": "string",
    "status_effects": [ /* Status effects like "bleeding", "exhaustion" */ ]
  },
  "environment": {
    "hazards_active": [ "array" ],
    "crowd_mood": "string"
  },
  "narrative": "string"
}
\`\`\`

---

### **Response Rules:**
- The response **must be a single, valid JSON object**.
- Do **not** include explanations or extra text—only the JSON response.
- Update stats **logically based on the narrative result** (e.g., if a fighter is injured, reduce health/stamina).
- Ensure **consistent structure** in every response.

`

export async function getJudgeResult(prompt: { text: string}) {
  console.log(prompt)

  const responseSchema = z.object({
    gladiator_1: z.object({
      stats: z.object({
        health: z.coerce.string(),
        stamina: z.coerce.string(),
        strength: z.coerce.string(),
        agility: z.coerce.string(),
        wisdom: z.coerce.string(),
        sneaking: z.coerce.string(),
        dexterity: z.coerce.string()
      }),
      status_effects: z.array(z.string()),
      name: z.string()
    }),
    gladiator_2: z.object({
      stats: z.object({
        health: z.coerce.string(),
        stamina: z.coerce.string(),
        strength: z.coerce.string(),
        agility: z.coerce.string(),
        wisdom: z.coerce.string(),
        sneaking: z.coerce.string(),
        dexterity: z.coerce.string()
      }),
      status_effects: z.array(z.string()),
      name: z.string()
    }),
    environment: z.object({
      hazards_active: z.array(z.string()),
      crowd_mood: z.string()
    }),
    narrative: z.string()
  })

  let retries = 3

  let response = {
    error: null,
    data: null
  }

  do {
    const completion = await getCompletion(prompt.text, "meta-llama/Llama-3.3-70B-Instruct", responseTemplate)

    if (completion?.choices[0] === undefined) {
      retries -= 1
      continue
    }

    const mes = completion.choices[0].message;
    console.log(mes)
    try {
      let correctMessage = mes.content.replace(/```json\n?/, '').replace(/```/, '').trim();

      console.log(correctMessage)

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

