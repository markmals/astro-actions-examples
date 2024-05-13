import { actions } from 'astro:actions';
import { useAction } from '../lib/solid-actions';
import { Show } from 'solid-js';

export function NewsletterForm(props: { showSuccessBanner: boolean }) {
    const [newsletter, { Form }] = useAction(actions.newsletter);

    return (
        <div class="flex flex-col gap-6 text-left">
            <Form class="flex flex-col items-start gap-6">
                <div class="w-full sm:col-span-4">
                    <label for="email" class="block text-sm font-medium leading-6 text-gray-900">
                        Email address
                    </label>
                    <div class="mt-2">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        />
                    </div>
                </div>

                <div class="relative flex gap-x-3">
                    <div class="flex h-6 items-center">
                        <input
                            id="receivePromo"
                            name="receivePromo"
                            type="checkbox"
                            checked={true}
                            class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        />
                    </div>

                    <div class="text-sm leading-6">
                        <label for="receivePromo" class="font-medium text-gray-900">
                            Receive promotional emails
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={newsletter.pending}
                    class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 enabled:hover:bg-indigo-500 disabled:bg-slate-400 disabled:text-slate-900"
                >
                    Sign Up
                </button>
            </Form>

            <Show when={newsletter.result?.success || props.showSuccessBanner}>
                <div class="rounded-md bg-green-50 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg
                                class="h-5 w-5 text-green-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-green-800">Account Created!</h3>
                            <div class="mt-2 text-sm text-green-700">
                                <p>You {true ? 'will' : 'will not'} recieve promotional emails.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
