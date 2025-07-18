import { z } from "zod";

export const dateSchma = z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") return new Date(val);
    return val;
}, z.date())

export const emotionsSchema = z.enum(["excited", "happy"])
export type emotionsType = z.infer<typeof emotionsSchema>

export const dialogueSchema = z.object({
    characterId: z.string().min(1),
    sentence: z.string(),
    emotions: emotionsSchema.nullable(),
})
export type dialogueType = z.infer<typeof dialogueSchema>

export const sceneSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    diologue: dialogueSchema.array(),
    backgroundImageSrc: z.string().min(1).nullable(),
})
export type sceneType = z.infer<typeof sceneSchema>

export const gptStoryResponseSchema = z.object({
    scenes: sceneSchema.array(),
})
export type gptStoryResponseType = z.infer<typeof gptStoryResponseSchema>

export const gptAlterSceneResponseSchema = z.object({
    scene: sceneSchema
})
export type gptAlterSceneResponseType = z.infer<typeof gptAlterSceneResponseSchema>

export const alterScenesObjSchema = z.record(z.string(), z.object({
    prompt: z.string().min(1),
    loading: z.boolean(),
    referencedScenes: z.string(),
    variationIndex: z.number(),
    variations: sceneSchema.array()
}))
export type alterScenesObjType = z.infer<typeof alterScenesObjSchema>

export const gptApiResponseExample = {
    "id": "resp_6879932e7864819a83b608b1a99308c5045d5a70ea6ce0e1",
    "object": "response",
    "created_at": 1752797998,
    "status": "completed",
    "background": false,
    "error": null,
    "incomplete_details": null,
    "instructions": null,
    "max_output_tokens": null,
    "max_tool_calls": null,
    "model": "gpt-4.1-2025-04-14",
    "output": [
        {
            "id": "msg_6879932ee394819aaa75f75850e34642045d5a70ea6ce0e1",
            "type": "message",
            "status": "completed",
            "content": [
                {
                    "type": "output_text",
                    "annotations": [],
                    "logprobs": [],
                    "text": "{\"scenes\":[{\"title\":\"Sunshine Wakes Up\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"Good morning, world! I’m ready to shine!\",\"emotions\":\"excited\"},{\"characterId\":\"Birdie\",\"sentence\":\"Chirp, chirp! Thank you for waking me up, Sunshine!\",\"emotions\":\"happy\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80\"},{\"title\":\"Sunshine Helps Flowers\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"Hello, flowers! Let me wrap you in my warm light.\",\"emotions\":\"happy\"},{\"characterId\":\"Flower\",\"sentence\":\"Yay! With your help, I can bloom and grow!\",\"emotions\":\"excited\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=800&q=80\"},{\"title\":\"Sunshine Makes Friends\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"I love to share my light with everyone!\",\"emotions\":\"excited\"},{\"characterId\":\"Child\",\"sentence\":\"Let’s play outside! Thank you, Sunshine!\",\"emotions\":\"happy\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1502082553048-f009c37129b9?fit=crop&w=800&q=80\"},{\"title\":\"Sunshine Says Goodnight\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"Time to take a rest, but I’ll shine again tomorrow!\",\"emotions\":\"happy\"},{\"characterId\":\"Moon\",\"sentence\":\"Sleep well, Sunshine! I’ll watch over everyone tonight.\",\"emotions\":\"happy\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80\"}]}",
                    "parsed": {
                        "scenes": [
                            {
                                "title": "Sunshine Wakes Up",
                                "diologue": [
                                    {
                                        "characterId": "Sunshine",
                                        "sentence": "Good morning, world! I’m ready to shine!",
                                        "emotions": "excited"
                                    },
                                    {
                                        "characterId": "Birdie",
                                        "sentence": "Chirp, chirp! Thank you for waking me up, Sunshine!",
                                        "emotions": "happy"
                                    }
                                ],
                                "backgroundImageSrc": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80"
                            },
                            {
                                "title": "Sunshine Helps Flowers",
                                "diologue": [
                                    {
                                        "characterId": "Sunshine",
                                        "sentence": "Hello, flowers! Let me wrap you in my warm light.",
                                        "emotions": "happy"
                                    },
                                    {
                                        "characterId": "Flower",
                                        "sentence": "Yay! With your help, I can bloom and grow!",
                                        "emotions": "excited"
                                    }
                                ],
                                "backgroundImageSrc": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=800&q=80"
                            },
                            {
                                "title": "Sunshine Makes Friends",
                                "diologue": [
                                    {
                                        "characterId": "Sunshine",
                                        "sentence": "I love to share my light with everyone!",
                                        "emotions": "excited"
                                    },
                                    {
                                        "characterId": "Child",
                                        "sentence": "Let’s play outside! Thank you, Sunshine!",
                                        "emotions": "happy"
                                    }
                                ],
                                "backgroundImageSrc": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?fit=crop&w=800&q=80"
                            },
                            {
                                "title": "Sunshine Says Goodnight",
                                "diologue": [
                                    {
                                        "characterId": "Sunshine",
                                        "sentence": "Time to take a rest, but I’ll shine again tomorrow!",
                                        "emotions": "happy"
                                    },
                                    {
                                        "characterId": "Moon",
                                        "sentence": "Sleep well, Sunshine! I’ll watch over everyone tonight.",
                                        "emotions": "happy"
                                    }
                                ],
                                "backgroundImageSrc": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80"
                            }
                        ]
                    }
                }
            ],
            "role": "assistant"
        }
    ],
    "parallel_tool_calls": true,
    "previous_response_id": null,
    "reasoning": {
        "effort": null,
        "summary": null
    },
    "service_tier": "default",
    "store": true,
    "temperature": 1,
    "text": {
        "format": {
            "type": "json_schema",
            "description": null,
            "name": "gptStoryResponse",
            "schema": {
                "type": "object",
                "properties": {
                    "scenes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "title": {
                                    "type": "string",
                                    "minLength": 1
                                },
                                "diologue": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "characterId": {
                                                "type": "string",
                                                "minLength": 1
                                            },
                                            "sentence": {
                                                "type": "string"
                                            },
                                            "emotions": {
                                                "anyOf": [
                                                    {
                                                        "type": "string",
                                                        "enum": [
                                                            "excited",
                                                            "happy"
                                                        ]
                                                    },
                                                    {
                                                        "type": "null"
                                                    }
                                                ]
                                            }
                                        },
                                        "required": [
                                            "characterId",
                                            "sentence",
                                            "emotions"
                                        ],
                                        "additionalProperties": false
                                    }
                                },
                                "backgroundImageSrc": {
                                    "anyOf": [
                                        {
                                            "type": "string",
                                            "minLength": 1
                                        },
                                        {
                                            "type": "null"
                                        }
                                    ]
                                }
                            },
                            "required": [
                                "title",
                                "diologue",
                                "backgroundImageSrc"
                            ],
                            "additionalProperties": false
                        }
                    }
                },
                "required": [
                    "scenes"
                ],
                "additionalProperties": false
            },
            "strict": true
        }
    },
    "tool_choice": "auto",
    "tools": [],
    "top_logprobs": 0,
    "top_p": 1,
    "truncation": "disabled",
    "usage": {
        "input_tokens": 139,
        "input_tokens_details": {
            "cached_tokens": 0
        },
        "output_tokens": 401,
        "output_tokens_details": {
            "reasoning_tokens": 0
        },
        "total_tokens": 540
    },
    "user": null,
    "metadata": {},
    "output_text": "{\"scenes\":[{\"title\":\"Sunshine Wakes Up\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"Good morning, world! I’m ready to shine!\",\"emotions\":\"excited\"},{\"characterId\":\"Birdie\",\"sentence\":\"Chirp, chirp! Thank you for waking me up, Sunshine!\",\"emotions\":\"happy\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80\"},{\"title\":\"Sunshine Helps Flowers\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"Hello, flowers! Let me wrap you in my warm light.\",\"emotions\":\"happy\"},{\"characterId\":\"Flower\",\"sentence\":\"Yay! With your help, I can bloom and grow!\",\"emotions\":\"excited\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=800&q=80\"},{\"title\":\"Sunshine Makes Friends\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"I love to share my light with everyone!\",\"emotions\":\"excited\"},{\"characterId\":\"Child\",\"sentence\":\"Let’s play outside! Thank you, Sunshine!\",\"emotions\":\"happy\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1502082553048-f009c37129b9?fit=crop&w=800&q=80\"},{\"title\":\"Sunshine Says Goodnight\",\"diologue\":[{\"characterId\":\"Sunshine\",\"sentence\":\"Time to take a rest, but I’ll shine again tomorrow!\",\"emotions\":\"happy\"},{\"characterId\":\"Moon\",\"sentence\":\"Sleep well, Sunshine! I’ll watch over everyone tonight.\",\"emotions\":\"happy\"}],\"backgroundImageSrc\":\"https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80\"}]}",
    "output_parsed": {
        "scenes": [
            {
                "title": "Sunshine Wakes Up",
                "diologue": [
                    {
                        "characterId": "Sunshine",
                        "sentence": "Good morning, world! I’m ready to shine!",
                        "emotions": "excited"
                    },
                    {
                        "characterId": "Birdie",
                        "sentence": "Chirp, chirp! Thank you for waking me up, Sunshine!",
                        "emotions": "happy"
                    }
                ],
                "backgroundImageSrc": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80"
            },
            {
                "title": "Sunshine Helps Flowers",
                "diologue": [
                    {
                        "characterId": "Sunshine",
                        "sentence": "Hello, flowers! Let me wrap you in my warm light.",
                        "emotions": "happy"
                    },
                    {
                        "characterId": "Flower",
                        "sentence": "Yay! With your help, I can bloom and grow!",
                        "emotions": "excited"
                    }
                ],
                "backgroundImageSrc": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=800&q=80"
            },
            {
                "title": "Sunshine Makes Friends",
                "diologue": [
                    {
                        "characterId": "Sunshine",
                        "sentence": "I love to share my light with everyone!",
                        "emotions": "excited"
                    },
                    {
                        "characterId": "Child",
                        "sentence": "Let’s play outside! Thank you, Sunshine!",
                        "emotions": "happy"
                    }
                ],
                "backgroundImageSrc": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?fit=crop&w=800&q=80"
            },
            {
                "title": "Sunshine Says Goodnight",
                "diologue": [
                    {
                        "characterId": "Sunshine",
                        "sentence": "Time to take a rest, but I’ll shine again tomorrow!",
                        "emotions": "happy"
                    },
                    {
                        "characterId": "Moon",
                        "sentence": "Sleep well, Sunshine! I’ll watch over everyone tonight.",
                        "emotions": "happy"
                    }
                ],
                "backgroundImageSrc": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80"
            }
        ]
    }
}

export const scenesExample: sceneType[] = [
    {
        id: "1",
        "title": "Sunshine Wakes Up",
        "diologue": [
            {
                "characterId": "Sunshine",
                "sentence": "Good morning, world! I’m ready to shine!",
                "emotions": "excited"
            },
            {
                "characterId": "Birdie",
                "sentence": "Chirp, chirp! Thank you for waking me up, Sunshine!",
                "emotions": "happy"
            }
        ],
        "backgroundImageSrc": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80"
    },
    {
        id: "2",
        "title": "Sunshine Helps Flowers",
        "diologue": [
            {
                "characterId": "Sunshine",
                "sentence": "Hello, flowers! Let me wrap you in my warm light.",
                "emotions": "happy"
            },
            {
                "characterId": "Flower",
                "sentence": "Yay! With your help, I can bloom and grow!",
                "emotions": "excited"
            }
        ],
        "backgroundImageSrc": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=800&q=80"
    },
    {
        id: "3",
        "title": "Sunshine Makes Friends",
        "diologue": [
            {
                "characterId": "Sunshine",
                "sentence": "I love to share my light with everyone!",
                "emotions": "excited"
            },
            {
                "characterId": "Child",
                "sentence": "Let’s play outside! Thank you, Sunshine!",
                "emotions": "happy"
            }
        ],
        "backgroundImageSrc": "https://images.unsplash.com/photo-1502082553048-f009c37129b9?fit=crop&w=800&q=80"
    },
    {
        id: "4",
        "title": "Sunshine Says Goodnight",
        "diologue": [
            {
                "characterId": "Sunshine",
                "sentence": "Time to take a rest, but I’ll shine again tomorrow!",
                "emotions": "happy"
            },
            {
                "characterId": "Moon",
                "sentence": "Sleep well, Sunshine! I’ll watch over everyone tonight.",
                "emotions": "happy"
            }
        ],
        "backgroundImageSrc": "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?fit=crop&w=800&q=80"
    }
]




















export const characterSchema = z.object({
    //defaults
    id: z.string().min(1),
    //null
    name: z.string().min(1).nullable(),
})
export type characterType = z.infer<typeof characterSchema> & {
}