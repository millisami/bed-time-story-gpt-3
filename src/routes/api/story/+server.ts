import { OPENAI_API_KEY } from '$env/static/private'
import type { RequestHandler } from './$types'
import { stripIndent, oneLine } from 'common-tags'
import type { CreateCompletionRequest } from 'openai'
import { error, type Config } from '@sveltejs/kit'

export const config: Config = {
	runtime: 'edge'
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY env is not set')
		}

		const requestData = await request.json()
		if (!requestData) {
			throw new Error('Request data is missing')
		}

		const { context } = requestData
		if (!context) {
			throw new Error('No context provided')
		}

		const prompt = stripIndent`
    ${oneLine`
    You are an enthusiastic story teller who loves telling bed time stories to kids. Tell a short story based on the context below so that 5 to 8 years old kid would listen to before going to bed.
    `}

    Context:"""${context.trim()}"""

    Answer:
    `

		const completionOpts: CreateCompletionRequest = {
			model: 'text-davinci-003',
			prompt,
			max_tokens: 512,
			temperature: 0.9,
			stream: true
		}

		const response = await fetch('https://api.openai.com/v1/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(completionOpts)
		})

		if (!response.ok) {
			const err = await response.json()
			console.log(err)
			throw new Error('Failed to create the completion', err)
		}

		return new Response(response.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		})
	} catch (err) {
		console.error(err)
		throw error(500, 'An error occured')
	}
}
