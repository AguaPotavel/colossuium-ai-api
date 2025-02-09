import { config } from "dotenv"

config()

export async function getCompletion(prompt: string, model: string, template: string) {
  const response = await fetch(`https://api.atoma.network/v1/chat/completions`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ATOMA_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { "role": "system", "content": template },
        { "role": "user", "content": prompt }
      ]
    }),
    method: "POST",
  })

  return response.json()
}
