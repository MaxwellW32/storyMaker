//<<replace in prod - seenProject>>
var seenProject = {
    "id": "fc5aba52-55ed-46fe-8fe4-169c6bf1e2a1",
    "dateCreated": "2025-08-01T06:06:02.178Z",
    "prompt": "please write a story going through the forest looking for a worm. short. use different views in the location to go through the forest.",
    "baseInstructions": "Write very short, engaging children’s stories.\n            \n    The story is broken into scenes, and each scene represents one distinct visual moment.\n    If the story changes location/location view, scenario, or camera angle, start a new scene.\n    Dialogue must match the action, emotion, and mood of the scene it belongs to.\n    Characters’ emotions in dialogue must come only from their own character obj, can be null if not needed to specify emotion.\n    \n    Each scene has visualInstructions that maps what a character is doing in the scene e.g Character Name A talking to B. I will use this to generate poses/scene visuals later so choose what you think is best to represent the scene given the dialogue. \n    Each location represents an area e.g Forest, that is split up into multiple views e.g forest entrance, deep forest, forest exit...etc. Each scene takes place at a specific location, note each scene's locationId from a location of your choice from the below options that best represents the story direction you come up with. Each scene's viewId must be from a specific view in that location.\n    \n    Characters:\n    [[characters]]\n\n    Locations:\n    [[locations]]\n\n",
    "scenes": [
        {
            "id": "0c972208-0983-4f89-ba0a-f7baf2041256",
            "title": "At the Forest Edge",
            "dialogue": [
                {
                    "id": "472a6dc3-9e64-4add-8bcf-b6decc526acf",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "Do you think we'll find a worm that makes tunnels like tiny underground trains?",
                    "emotions": "excited"
                },
                {
                    "id": "29097d01-b37e-48b3-900f-766f3db0cb91",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "Totally — let's sprint in and see! Worm-hunting rules: fast feet, slow hands!",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": "0c972208-0983-4f89-ba0a-f7baf2041256____fd7c8daf-61bb-4788-9a09-ddf9b182318d.webp",
            "activeAppearanceObj": {
                "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8": "b5c92147-e099-4972-96ec-bcd9903ba549",
                "89b09350-30f5-4c85-a553-064e69706f26": "9996aeec-793f-4888-9249-201ac3018cf8"
            },
            "visualInstructions": "Max standing at the forest edge, pointing toward the trees while Kim bounces on her toes, ready to dash inside.",
            "locationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
            "viewId": "b9354794-b90b-409a-8e0a-17eb2da16dba"
        },
        {
            "id": "186b894b-bdea-4dd5-b03d-3fecfdc2a506",
            "title": "Forest Entrance: The Plan",
            "dialogue": [
                {
                    "id": "6612194c-f588-48bc-ad6d-9deda3fcbcc3",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "Do you think we'll find a worm near the roots or under the leaf pile?",
                    "emotions": "excited"
                },
                {
                    "id": "3143177e-052b-4acb-bf71-6efbb48ade59",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "Roots, leaves, puddles—worms love all of them! Let's race to the big oak!",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": "186b894b-bdea-4dd5-b03d-3fecfdc2a506.png",
            "activeAppearanceObj": {
                "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8": "b5c92147-e099-4972-96ec-bcd9903ba549",
                "89b09350-30f5-4c85-a553-064e69706f26": "9996aeec-793f-4888-9249-201ac3018cf8"
            },
            "visualInstructions": "Max and Kim stand at the forest edge, pointing toward the trees and deciding which path to take.",
            "locationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
            "viewId": "b9354794-b90b-409a-8e0a-17eb2da16dba"
        },
        {
            "id": "9baf65f7-812e-4d9d-824d-2b9861c2a0a1",
            "title": "Oasis Clearing: A Clue",
            "dialogue": [
                {
                    "id": "6d1c54f4-f422-4aa1-8508-faeb09e492d1",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "There’s a damp, shiny trail by the puddle—maybe the worm went this way!",
                    "emotions": "excited"
                },
                {
                    "id": "b4aa86a6-9311-4acd-b045-7b5642c004a9",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "Follow the sparkle! Worms love wet, wiggly paths—let's go!",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": "9baf65f7-812e-4d9d-824d-2b9861c2a0a1.png",
            "activeAppearanceObj": {
                "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8": "b5c92147-e099-4972-96ec-bcd9903ba549",
                "89b09350-30f5-4c85-a553-064e69706f26": "9996aeec-793f-4888-9249-201ac3018cf8"
            },
            "visualInstructions": "Max points toward a glistening damp trail near a small puddle while Kim leans forward ready to follow it.",
            "locationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
            "viewId": "bf9b3706-7bc9-497f-bfd3-b27b01c4305a"
        },
        {
            "id": "0f2a8916-a1eb-4f41-9690-27b459331be2",
            "title": "test 2",
            "dialogue": [
                {
                    "id": "2e8efdaf-1df9-47da-85fe-76cdabdc0013",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "Kim, look! The tree's bark has tiny glowing arrows!",
                    "emotions": "excited"
                },
                {
                    "id": "362b1c63-5844-4be0-97c7-aa344ce1faf6",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "No way—treasure? Race you to the pink tree!",
                    "emotions": "excited"
                },
                {
                    "id": "57e61082-ea96-495f-8891-d01034e8fd6b",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "Wait—what if it's a puzzle? I want to study the arrows first.",
                    "emotions": "happy"
                },
                {
                    "id": "3a076a7f-2028-4438-9053-2a22ee14afe0",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "Boring! We'll study after we find it. Come on, let's find the worm!",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": "0f2a8916-a1eb-4f41-9690-27b459331be2.png",
            "activeAppearanceObj": {
                "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8": "b5c92147-e099-4972-96ec-bcd9903ba549",
                "89b09350-30f5-4c85-a553-064e69706f26": "9996aeec-793f-4888-9249-201ac3018cf8"
            },
            "visualInstructions": "The characters were talking...",
            "locationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
            "viewId": "b7bb2e37-8ba6-4bcb-82dc-c4d7276a6069"
        },
        {
            "id": "c6fcc3e3-84d6-4dad-870f-852c8530eb8e",
            "title": "End of Forest: Found!",
            "dialogue": [
                {
                    "id": "787a716c-aa83-489e-b0eb-c0a422d2cd82",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "There it is—hello, little worm! We found you together.",
                    "emotions": "happy"
                },
                {
                    "id": "15391d10-671a-4b10-87ca-ed92a08760a0",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "Hi Wiggly! Let's leave it smiling and snug under this damp leaf.",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": "c6fcc3e3-84d6-4dad-870f-852c8530eb8e.png",
            "activeAppearanceObj": {
                "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8": "b5c92147-e099-4972-96ec-bcd9903ba549",
                "89b09350-30f5-4c85-a553-064e69706f26": "9996aeec-793f-4888-9249-201ac3018cf8"
            },
            "visualInstructions": "Max gently indicates the worm on the soil while Kim arranges a damp leaf nearby to make a cozy spot.",
            "locationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
            "viewId": "9869a2e1-9305-4abd-b8ba-f0e82b275fa9"
        },
        {
            "id": "75d02273-3c5b-4293-a836-a7a7b5b71dfe",
            "title": "test",
            "dialogue": [
                {
                    "id": "43709922-c207-4679-8a55-19ab713d9eeb",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "lets go to church",
                    "emotions": null
                },
                {
                    "id": "bacc1abe-be10-4952-a8ef-13fe4780d6fd",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "sure",
                    "emotions": null
                }
            ],
            "backgroundImageSrc": "75d02273-3c5b-4293-a836-a7a7b5b71dfe.png",
            "activeAppearanceObj": {
                "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8": "e83ed5a5-cdc6-47d0-841d-74820931fa39",
                "89b09350-30f5-4c85-a553-064e69706f26": "9996aeec-793f-4888-9249-201ac3018cf8"
            },
            "visualInstructions": "The characters were talking...",
            "locationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
            "viewId": "6543cf1f-469b-476f-a49a-5299da689d31"
        }
    ],
    "alterScenesObj": {},
    "alterDialogueObj": {
        "default": {
            "audioFileNameArray": [],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "0c972208-0983-4f89-ba0a-f7baf2041256": {
            "audioFileNameArray": [
                "0c972208-0983-4f89-ba0a-f7baf2041256__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "186b894b-bdea-4dd5-b03d-3fecfdc2a506": {
            "audioFileNameArray": [
                "186b894b-bdea-4dd5-b03d-3fecfdc2a506__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "9baf65f7-812e-4d9d-824d-2b9861c2a0a1": {
            "audioFileNameArray": [
                "9baf65f7-812e-4d9d-824d-2b9861c2a0a1__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "0f2a8916-a1eb-4f41-9690-27b459331be2": {
            "audioFileNameArray": [
                "0f2a8916-a1eb-4f41-9690-27b459331be2__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "c6fcc3e3-84d6-4dad-870f-852c8530eb8e": {
            "audioFileNameArray": [
                "c6fcc3e3-84d6-4dad-870f-852c8530eb8e__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "75d02273-3c5b-4293-a836-a7a7b5b71dfe": {
            "audioFileNameArray": [
                "75d02273-3c5b-4293-a836-a7a7b5b71dfe__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        }
    },
    "artStyle": "watercolor, storybook, clean linework",
    "activeLocationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
    "name": "first project",
    "userId": "c39a84cd-746e-470b-875e-27ce02ee78fa",
    "charactersToProjects": [
        {
            "simpleId": "ff224be7-348d-4579-bc81-71777444432b",
            "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
            "projectId": "fc5aba52-55ed-46fe-8fe4-169c6bf1e2a1",
            "activeAppearanceId": "b5c92147-e099-4972-96ec-bcd9903ba549",
            "character": {
                "id": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                "name": "max",
                "age": 8,
                "userId": "c39a84cd-746e-470b-875e-27ce02ee78fa",
                "voiceId": "Dslrhjl3ZpzrctukrQSN",
                "appearances": [
                    {
                        "id": "b5c92147-e099-4972-96ec-bcd9903ba549",
                        "name": "default",
                        "description": "A boy with a round, youthful face and slightly flushed cheeks, lightly dusted with small freckles across the bridge of his nose. Hazel eyes, large and almond-shaped, with a bright, curious expression, framed by long, dark lashes. Hair is a tousled mop of soft chestnut brown, with natural golden highlights that catch the light, falling in messy layers just above the eyebrows and ears.\n\nWearing a short-sleeved sky-blue T-shirt with a small embroidered patch of a magnifying glass on the left chest. Comfortable, medium-wash denim shorts ending just above the knees. Mismatched ankle socks—one patterned with tiny rocket ships, the other with bright yellow stars. Well-worn white sneakers, slightly scuffed at the toes. Around his neck is a thin lanyard with a small notepad and stubby pencil hanging from it. A couple of colorful braided friendship bracelets on his left wrist.",
                        "file": {
                            "createdAt": "2025-08-13T04:56:09.392Z",
                            "fileName": "download (2).webp",
                            "src": "b5c92147-e099-4972-96ec-bcd9903ba549.webp",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "uploadedFrom": "main"
                    },
                    {
                        "id": "6f254653-276c-4eb6-8a09-e1c445108505",
                        "name": "sports",
                        "description": "An 8-year-old boy with a round, youthful face and slightly flushed cheeks, lightly dusted with small freckles across the bridge of his nose. Hazel eyes, large and almond-shaped, with a bright, curious expression, framed by long, dark lashes. Hair is a tousled mop of soft chestnut brown, with natural golden highlights that catch the light, falling in messy layers just above the eyebrows and ears.\n\nWearing a lightweight red sports jersey with white side stripes and the number “7” printed on the front, slightly oversized so it hangs loosely on his frame. Black athletic shorts with white piping down the sides, ending just above the knees. White crew socks pulled halfway up the shin, and sporty black-and-white running shoes with visible grass stains. A simple sweatband in matching red sits loosely around his right wrist, and a water bottle hangs from a crossbody mesh strap slung over his shoulder.",
                        "file": {
                            "createdAt": "2025-08-13T04:55:41.517Z",
                            "fileName": "download (3).webp",
                            "src": "6f254653-276c-4eb6-8a09-e1c445108505.webp",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "uploadedFrom": "main"
                    },
                    {
                        "id": "e83ed5a5-cdc6-47d0-841d-74820931fa39",
                        "name": "church",
                        "description": "An 8-year-old boy with a round, youthful face and slightly flushed cheeks, lightly dusted with small freckles across the bridge of his nose. Hazel eyes, large and almond-shaped, with a bright, curious expression, framed by long, dark lashes. Hair is a tousled mop of soft chestnut brown, with natural golden highlights that catch the light, falling in messy layers just above the eyebrows and ears.\n\nChurch fit",
                        "file": {
                            "createdAt": "2025-08-14T17:16:15.180Z",
                            "fileName": "f72f72b4-170e-4bf2-91a3-9eda23a9bcc5___cf9fc38e-1690-4400-bfcb-872988622b58.webp",
                            "src": "e83ed5a5-cdc6-47d0-841d-74820931fa39___86458923-98dc-4eb9-aa27-dc3756497599.webp",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "uploadedFrom": "main"
                    }
                ],
                "personality": "cheerful and analytical",
                "toneOfVoice": "friendly with a curious edge",
                "dialogueStyle": "asks a lot of questions, often uses analogies to explain thoughts",
                "alignment": "Neutral Good",
                "goal": "to uncover hidden truths in the world and help others understand them",
                "fear": "being wrong in a critical moment or leading someone astray",
                "fatalFlaw": "tends to overthink and miss opportunities due to analysis paralysis",
                "backstory": "Raised by a scientist and a schoolteacher in a tech-savvy town, Max grew up asking 'why' about everything. After solving a major local mystery as a teen, he became obsessed with understanding systems—social, mechanical, and emotional.",
                "occupation": "student",
                "location": "a cozy apartment above a busy bookstore in the heart of the country side",
                "archetype": "The Thinker",
                "charactersToEmotions": [
                    {
                        "simpleId": "b72b7f4e-e05f-4f38-a1bc-2760705a7aa0",
                        "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                        "emotionType": "happy"
                    },
                    {
                        "simpleId": "f7276c4f-a7c1-4da1-a05a-adf6a7cce7b5",
                        "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                        "emotionType": "excited"
                    }
                ]
            }
        },
        {
            "simpleId": "1d9dc1a9-79ec-457e-bba0-2bd6bc42635e",
            "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
            "projectId": "fc5aba52-55ed-46fe-8fe4-169c6bf1e2a1",
            "activeAppearanceId": "9996aeec-793f-4888-9249-201ac3018cf8",
            "character": {
                "id": "89b09350-30f5-4c85-a553-064e69706f26",
                "name": "kim",
                "age": 10,
                "userId": "c39a84cd-746e-470b-875e-27ce02ee78fa",
                "voiceId": "rCmVtv8cYU60uhlsOo1M",
                "appearances": [
                    {
                        "id": "9996aeec-793f-4888-9249-201ac3018cf8",
                        "name": "Default",
                        "description": "A lively girl with a sun-kissed, warm beige complexion and a dusting of freckles across her cheeks and nose. Her face is round with expressive almond-shaped brown eyes that sparkle with mischief, framed by thick lashes. Her hair is jet-black, cut into a playful chin-length bob with choppy bangs that sometimes fall into her eyes, always slightly tousled as if she’s just been running around. Her cheeks are often flushed from excitement, and her bright, wide smile reveals a small gap between her front teeth.\n\nShe’s wearing a loose, lemon-yellow hoodie with an oversized kangaroo pocket, the sleeves a little too long so they bunch at her wrists. Her shorts are denim with frayed hems, and she’s got mismatched socks—one striped in rainbow colors and one plain pink—peeking out of worn red sneakers decorated with tiny doodles in marker. A thin friendship bracelet made of colorful yarn wraps around her left wrist.",
                        "file": {
                            "createdAt": "2025-08-13T04:58:05.104Z",
                            "fileName": "download (4).webp",
                            "src": "9996aeec-793f-4888-9249-201ac3018cf8.webp",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "uploadedFrom": "main"
                    }
                ],
                "personality": "cheerful and impulsive",
                "toneOfVoice": "playful and energetic, often teasing",
                "dialogueStyle": "uses slang, interrupts herself mid-sentence, and changes topics quickly",
                "alignment": "Chaotic Good",
                "goal": "to experience as much of life as possible without being tied down",
                "fear": "being stuck in a boring routine or losing her freedom",
                "fatalFlaw": "acts before thinking, often causing unintended consequences",
                "backstory": "Kim grew up in a quiet suburb but always craved excitement. She left home at 18 and has been bouncing from city to city ever since—chasing music festivals, spontaneous adventures, and fleeting jobs. She’s earned both friends and enemies with her wild charm.",
                "occupation": "travel vlogger and part-time street performer",
                "location": "wherever the wind takes her—currently crashing on a friend's couch in a neon-lit coastal city",
                "archetype": "The Free Spirit",
                "charactersToEmotions": [
                    {
                        "simpleId": "0c7fbf50-3599-4cdd-b185-08188d32d2e0",
                        "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                        "emotionType": "excited"
                    }
                ]
            }
        }
    ],
    "locationsToProjects": [
        {
            "simpleId": "65986cdf-e016-421c-a3bf-d0e6eaa20e4c",
            "locationId": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
            "projectId": "fc5aba52-55ed-46fe-8fe4-169c6bf1e2a1",
            "activeViewId": "b7bb2e37-8ba6-4bcb-82dc-c4d7276a6069",
            "location": {
                "id": "cfd442bf-7e0a-478e-8954-b10b9f8d853c",
                "userId": "c39a84cd-746e-470b-875e-27ce02ee78fa",
                "name": "magical green forest",
                "description": "a lush green magical forest",
                "views": [
                    {
                        "id": "b9354794-b90b-409a-8e0a-17eb2da16dba",
                        "name": "entrance",
                        "locationVariationName": "spring",
                        "file": {
                            "createdAt": "2025-08-13T17:16:21.376Z",
                            "fileName": "download (11).webp",
                            "src": "b9354794-b90b-409a-8e0a-17eb2da16dba.webp",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "description": "the lush opening of this magical forest, greenery nature at play. "
                    },
                    {
                        "id": "b7bb2e37-8ba6-4bcb-82dc-c4d7276a6069",
                        "name": "middle of forest",
                        "locationVariationName": "spring",
                        "file": {
                            "createdAt": "2025-08-13T17:20:21.012Z",
                            "fileName": "0e814140-8a81-4abf-9277-ed46d2589357.png",
                            "src": "b7bb2e37-8ba6-4bcb-82dc-c4d7276a6069.png",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "description": "the lush middle of this magical forest, greenery nature at play. "
                    },
                    {
                        "id": "9869a2e1-9305-4abd-b8ba-f0e82b275fa9",
                        "name": "end of forest",
                        "locationVariationName": "spring",
                        "file": {
                            "createdAt": "2025-08-13T17:28:27.784Z",
                            "fileName": "537b3cdb-9328-4eab-a4b0-264813de4013.png",
                            "src": "9869a2e1-9305-4abd-b8ba-f0e82b275fa9.png",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "description": "the lush end of this magical forest, greenery nature at play. "
                    },
                    {
                        "id": "bf9b3706-7bc9-497f-bfd3-b27b01c4305a",
                        "name": "oasis",
                        "locationVariationName": "spring",
                        "file": {
                            "createdAt": "2025-08-14T16:38:31.950Z",
                            "fileName": "bf9b3706-7bc9-497f-bfd3-b27b01c4305a.png",
                            "src": "bf9b3706-7bc9-497f-bfd3-b27b01c4305a.png",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "description": "water oasis in a clearing in the middle of the thick forest"
                    },
                    {
                        "id": "6543cf1f-469b-476f-a49a-5299da689d31",
                        "name": "pink forest entrance",
                        "locationVariationName": "japan",
                        "file": {
                            "createdAt": "2025-08-14T15:12:26.812Z",
                            "fileName": "9d3e5156-744a-49f3-9854-1902bb240410.png",
                            "src": "6543cf1f-469b-476f-a49a-5299da689d31.png",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "fileCategory": "image"
                        },
                        "description": "pink trees"
                    }
                ]
            }
        }
    ]
}
//<<replace in prod - seenProject>>

app.beginUndoGroup("Import project");

//clear all
clearProject()

var compWidth = 1920
var compHeight = 1080

var mainComp = app.project.items.addComp("main", compWidth, compHeight, 1, 1 * 60 * 60, 24); //make 1hr, 24 fps

//<<replace in prod - projectBaseDir>>
var projectBaseDir = "C:/Users/max/Downloads" + "/" + seenProject.name;
//<<replace in prod - projectBaseDir>>
var charactersDirName = "characters";
var projectDirName = "project";
var audioDirName = "audio";
var imagesDirName = "images";

var currentTime = 0

for (var sceneIndex = 0; sceneIndex < seenProject.scenes.length; sceneIndex++) {
    var eachScene = seenProject.scenes[sceneIndex];

    var sceneBackgroundImagePath = projectBaseDir + "/" + projectDirName + "/" + imagesDirName + "/" + eachScene.backgroundImageSrc;
    var sceneBackgroundImageFile = File(sceneBackgroundImagePath);

    //Ensure file exists
    if (!sceneBackgroundImageFile.exists) {
        throw new Error("Image background file not found: " + sceneBackgroundImagePath);
    }

    var importedImage = app.project.importFile(new ImportOptions(sceneBackgroundImageFile));

    //add to the comp
    var imageLayer = mainComp.layers.add(importedImage);

    //set the image layer point
    imageLayer.inPoint = currentTime; //0, 10...etc




    //get audio for scene
    var seenAlterDialogueObj = seenProject.alterDialogueObj[eachScene.id];

    //ensure seenAlterDialogueObj is there for each dialogue
    if (seenAlterDialogueObj === undefined) {
        throw new Error("not seeing seenAlterDialogueObj for " + eachScene.id)
    }

    //audio
    var dialogueAudioPath = projectBaseDir + "/" + projectDirName + "/" + audioDirName + "/" + seenAlterDialogueObj.audioFileNameArray[seenAlterDialogueObj.variationIndex];
    var dialogueAudioFile = File(dialogueAudioPath);

    //Ensure file exists
    if (!dialogueAudioFile.exists) {
        throw new Error("Audio file not found: " + dialogueAudioPath);
    }

    //add to the comp
    var importedAudio = app.project.importFile(new ImportOptions(dialogueAudioFile));
    var audioLayer = mainComp.layers.add(importedAudio);

    //set the start time
    audioLayer.startTime = currentTime;

    var dialogueTime = 0

    // subtitles
    for (var dialogueIndex = 0; dialogueIndex < eachScene.dialogue.length; dialogueIndex++) {
        var eachDialogue = eachScene.dialogue[dialogueIndex];

        var inPointSmallOffset = 0
        var outPointSmallOffset = 0

        var marginFromBottom = 60;       // distance from bottom of comp
        var horizontalMargin = 200;      // margin from left/right edges

        // Calculate box width with margins applied
        var boxWidth = mainComp.width - (horizontalMargin * 2);
        var boxHeight = 150; // enough for 2–3 lines of text

        // Create box text layer with wrapping
        var textLayer = mainComp.layers.addBoxText([boxWidth, boxHeight]);

        //rules - dont touch first layer
        if (dialogueIndex !== 0) {
            inPointSmallOffset = -0.3
        }

        //rules - dont touch last layer
        if (dialogueIndex !== eachScene.dialogue.length - 1) {
            outPointSmallOffset = -0.3
        }

        // In point
        textLayer.inPoint = currentTime + dialogueTime + inPointSmallOffset;

        // Get text properties
        var textProp = textLayer.property("Source Text");
        var textDocument = textProp.value;

        // Set text
        textDocument.text = eachDialogue.sentence;

        // Font settings
        textDocument.font = "Calibri";   // PostScript font name
        textDocument.fontSize = 50;           // Small
        textDocument.fillColor = [1, 1, 1];   // White
        textDocument.applyFill = true;

        // Stroke settings
        textDocument.applyStroke = true;
        textDocument.strokeColor = [0, 0, 0]; // Black
        textDocument.strokeWidth = 4;

        // Center justification inside the box
        textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;

        // Apply changes
        textProp.setValue(textDocument);

        // Position box: horizontally centered, bottom margin applied
        textLayer.property("Position").setValue([
            mainComp.width / 2,
            mainComp.height - marginFromBottom - (boxHeight / 2)
        ]);


        //add up all character length for all dialogues
        var totalDialogueCharactersForScene = 0
        for (var smallDialogueIndex = 0; smallDialogueIndex < eachScene.dialogue.length; smallDialogueIndex++) {
            var eachSmallDialogue = eachScene.dialogue[smallDialogueIndex];

            totalDialogueCharactersForScene += eachSmallDialogue.sentence.length
        }

        //calculate and add on offset based on the ratio
        var offset = (eachDialogue.sentence.length / totalDialogueCharactersForScene) * importedAudio.duration
        //outPointSmallOffset
        dialogueTime += offset

        //set the last text layer out point
        textLayer.outPoint = currentTime + dialogueTime + outPointSmallOffset;









        //typewriter effect
        // Add a text animator for the typewriter effect
        var animators = textLayer.property("Text").property("Animators");
        var typewriter = animators.addProperty("ADBE Text Animator");

        // Add an opacity property to this animator
        var opacityProp = typewriter.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity");
        opacityProp.setValue(0); // characters start invisible

        // Add the "End" property under Range Selector
        var rangeSelector = typewriter.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
        var startProp = rangeSelector.property("ADBE Text Percent Start");
        var endProp = rangeSelector.property("ADBE Text Percent End");

        // Animate from 0% to 100% across the layer duration
        startProp.setValue(100);

        // Animate from 0% to 100% across the layer duration
        endProp.setValueAtTime(textLayer.inPoint, 0);
        endProp.setValueAtTime(textLayer.outPoint, 100);

        app.endUndoGroup();
    }

    //update current Time
    currentTime += importedAudio.duration

    //set the image layer out point
    imageLayer.outPoint = currentTime;
}

//open comp
mainComp.duration = currentTime;

mainComp.openInViewer();

app.endUndoGroup();

//clear all
function clearProject() {
    var items = app.project.items;
    for (var i = items.length; i >= 1; i--) { // loop backwards to avoid index shift
        items[i].remove();
    }
}