<script lang="ts">
	import type { CreateCompletionResponse } from 'openai'
	import { SSE } from 'sse.js'

	let context = ''
	let loading = false
	let error = false
	let answer = ''

	const handleSubmit = async () => {
		loading = true
		error = false
		answer = ''

		const eventSource = new SSE('/api/story', {
			headers: {
				'Content-Type': 'application/json'
			},
			payload: JSON.stringify({ context })
		})

		context = ''

		eventSource.addEventListener('error', (e) => {
			error = true
			loading = false
			alert('Something went wrong!')
		})

		eventSource.addEventListener('message', (e) => {
			try {
				loading = false
				if (e.data === '[DONE]') {
					return
				}

				const completionResponse: CreateCompletionResponse = JSON.parse(e.data)
				const [{ text }] = completionResponse.choices
				answer = (answer ?? '') + text
			} catch (error) {
				error = true
				loading = false
				console.error(error)
				alert('Something went wrong!')
			}
		})

		eventSource.stream()
	}
</script>

<h1>Tell me a bed time story</h1>
<form on:submit|preventDefault={() => handleSubmit()}>
	<label for="context">Enter the context for a story for your kid</label>
	<textarea name="context" rows="5" bind:value={context} />
	<button>Generate</button>
	<div class="pt-4">
		<h2>Bed time story:</h2>
		{#if answer}
			<p>{answer}</p>
		{/if}
	</div>
</form>
