// AE Scripting Beginners Tutorial [2022]

// Introduction
// Scripting allows you automate the tasks you normally do by hand
// You can run repetitive operations as many times as you want, instantly
// Access any properties, comps, layers, effects, expressions, keyframes, menu items

// Programs
// Adobe ExtendScript (No longer works for Mac) - https://www.adobe.com/products/extendscript-toolkit.htmlESTK
// Visual Studio Code - https://code.visualstudio.com/Download
// Extensions To Use:
// ExtendScript Debugger (by Adobe)
// Adobe Script Runner (by renderTom)


// var seenProject = [[seenProject]]
var seenProject = {
    "id": "fc5aba52-55ed-46fe-8fe4-169c6bf1e2a1",
    "dateCreated": "2025-08-01T06:06:02.178Z",
    "prompt": "please write a story on grapes",
    "scenes": [
        {
            "id": "fce4d960-4c37-4556-af2b-1a31a078cbb3",
            "title": "The Case of the Missing Grapes",
            "dialogue": [
                {
                    "id": "6aab5440-2367-478e-b97b-08998891716a",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "Did you know that grapes come in bunches, but when one goes missing, the whole bunch feels lighter? Huh, just like when you lose a sock! Was it always there to begin with?",
                    "emotions": "excited"
                },
                {
                    "id": "945781e3-de07-4d44-8c66-870b1cb31a65",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "Whoa, Max! I just saw a grape—no, a whole parade of grapes—rolling down the street. I swear! Or maybe it was just my snack escaping. Wait, where was I? Right! Grape rescue mission!",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": null
        },
        {
            "id": "f0e49db3-372b-4def-ab9b-dd8913ef5836",
            "title": "Grape Detectives",
            "dialogue": [
                {
                    "id": "d9e2ec2e-20d4-4c10-abd6-f1b60c1bc635",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "Let’s follow the grape trail. If we map the direction and velocity, maybe we can predict the endpoint! Or... do you think grapes believe in destiny?",
                    "emotions": "excited"
                },
                {
                    "id": "7747902c-89b6-4052-8986-5a56ec412269",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "Destiny? Maybe! Or maybe they just wanna roll into adventure, like me! You think grapes get bored hanging on the vine? Haha, let’s roll!",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": null
        },
        {
            "id": "ffacd6b0-77fe-49c3-a193-c7be19cb751a",
            "title": "The Grape Reunion",
            "dialogue": [
                {
                    "id": "a90a2298-31c9-45d6-b371-4c7f31ce6683",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "We found them! Turns out, some grapes had rolled under the playground slide. Gravity—always a sneaky accomplice, huh? Like a grape conspiracy!",
                    "emotions": "happy"
                },
                {
                    "id": "8f3c6bc2-35bd-4ee3-84ff-6699c64978cf",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "I knew it! Never trust grapes alone with a slide. Want one? Oops—no more rolling away, promise! Or... do they taste better if they’ve had an adventure first?",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": null
        },
        {
            "id": "4402a917-47a9-476e-8498-24e7e76a243f",
            "title": "Mystery Solved, Snack Time!",
            "dialogue": [
                {
                    "id": "ee73cf8a-56fa-4b9a-86e0-ee1fd59c791e",
                    "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                    "sentence": "Think of it as a snack with a story: these grapes discovered the world beyond the bowl, just like us sometimes. I wonder—does every grape want to explore?",
                    "emotions": "happy"
                },
                {
                    "id": "ee186bbd-b1e3-43ec-9f1c-a2d638ca7747",
                    "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                    "sentence": "If I was a grape? Totally. Next time, let’s chase strawberries—no, whole fruit markets! Let’s snack and solve at the same time!",
                    "emotions": "excited"
                }
            ],
            "backgroundImageSrc": null
        }
    ],
    "alterScenesObj": {
        "7079bff5-37f0-4d1d-b3d8-ba8cffd75bcf": {
            "prompt": "orange",
            "baseInstructions": "BaseInstructions:\n[[baseInstructions]]\n\n\nPlease alter the scene below using the users prompt.\nScene:\n[[scene]]\n\n\nYou can use these scenes for reference context if needed.\n[[referencedScenes]]",
            "loading": false,
            "referencedScenes": "",
            "variationIndex": 1,
            "variations": [
                {
                    "id": "7079bff5-37f0-4d1d-b3d8-ba8cffd75bcf",
                    "title": "meep",
                    "dialogue": [],
                    "backgroundImageSrc": null
                },
                {
                    "id": "7079bff5-37f0-4d1d-b3d8-ba8cffd75bcf",
                    "title": "The Curious Quest for the Orange Glow",
                    "dialogue": [
                        {
                            "id": "80421cba-c64a-4b12-8668-024769581b3b",
                            "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                            "sentence": "Kim, have you ever wondered why oranges are so bright, almost like they’re little suns with peels?",
                            "emotions": "excited"
                        },
                        {
                            "id": "91f04503-ef83-4044-b9aa-2c54990ba8fd",
                            "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                            "sentence": "Haha, Max! Everything’s more fun when it’s orange—y’know? Plus, squeezing ‘em makes the best mess. Wanna race to see who can peel one fastest? Oops, wait—what were you saying about the sun?",
                            "emotions": "excited"
                        },
                        {
                            "id": "37ad683c-8d64-46cb-bd68-9a690d64e3be",
                            "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                            "sentence": "Well, you know how the sun helps things grow? Oranges soak up all that sunlight, and inside their peel, there’s something called carotenoids! It’s like a secret code for orange colors in nature.",
                            "emotions": "happy"
                        },
                        {
                            "id": "366bacc3-faba-409b-9998-e8a9c9f3faa1",
                            "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                            "sentence": "Secret code?! Okay, so if I eat enough oranges, will I glow too? Maybe not like a lamp, but it’d be wild! Let’s try!",
                            "emotions": "excited"
                        }
                    ],
                    "backgroundImageSrc": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
                }
            ]
        },
        "74257321-231c-40f2-ba97-2a51d78cc34f": {
            "prompt": "Enter your prompt here",
            "baseInstructions": "BaseInstructions:\n[[baseInstructions]]\n\n\nPlease alter the scene below using the users prompt.\nScene:\n[[scene]]\n\n\nYou can use these scenes for reference context if needed.\n[[referencedScenes]]",
            "loading": false,
            "referencedScenes": "",
            "variationIndex": 1,
            "variations": []
        }
    },
    "alterDialogueObj": {
        "6aab5440-2367-478e-b97b-08998891716a": {
            "audioFileNameArray": [
                "6aab5440-2367-478e-b97b-08998891716a__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "945781e3-de07-4d44-8c66-870b1cb31a65": {
            "audioFileNameArray": [
                "945781e3-de07-4d44-8c66-870b1cb31a65__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "d9e2ec2e-20d4-4c10-abd6-f1b60c1bc635": {
            "audioFileNameArray": [
                "d9e2ec2e-20d4-4c10-abd6-f1b60c1bc635__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "7747902c-89b6-4052-8986-5a56ec412269": {
            "audioFileNameArray": [
                "7747902c-89b6-4052-8986-5a56ec412269__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "a90a2298-31c9-45d6-b371-4c7f31ce6683": {
            "audioFileNameArray": [
                "a90a2298-31c9-45d6-b371-4c7f31ce6683__1.mp3"
            ],
            "variationIndex": 0,
            "loading": false,
            "audioEditable": false
        },
        "8f3c6bc2-35bd-4ee3-84ff-6699c64978cf": {
            "audioFileNameArray": [
                "8f3c6bc2-35bd-4ee3-84ff-6699c64978cf__1.mp3"
            ],
            "variationIndex": 0,
            "loading": true,
            "audioEditable": true
        },
        "ee73cf8a-56fa-4b9a-86e0-ee1fd59c791e": {
            "audioFileNameArray": [
                "ee73cf8a-56fa-4b9a-86e0-ee1fd59c791e__1.mp3"
            ],
            "variationIndex": 0,
            "loading": true,
            "audioEditable": true
        },
        "ee186bbd-b1e3-43ec-9f1c-a2d638ca7747": {
            "audioFileNameArray": [
                "ee186bbd-b1e3-43ec-9f1c-a2d638ca7747__1.mp3"
            ],
            "variationIndex": 0,
            "loading": true,
            "audioEditable": true
        }
    },
    "name": "first project",
    "userId": "c39a84cd-746e-470b-875e-27ce02ee78fa",
    "baseInstructions": "write incredible short children stories. Please base the characters in the story from this [[characters]] emotions for each character in the dialogue must be taken from that character object only.",
    "charactersToProjects": [
        {
            "simpleId": "79773044-3a81-45bf-a07f-97584e153256",
            "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
            "projectId": "fc5aba52-55ed-46fe-8fe4-169c6bf1e2a1",
            "character": {
                "id": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                "name": "max",
                "age": 24,
                "userId": "c39a84cd-746e-470b-875e-27ce02ee78fa",
                "voiceId": "Dslrhjl3ZpzrctukrQSN",
                "personality": "cheerful and analytical",
                "toneOfVoice": "friendly with a curious edge",
                "dialogueStyle": "asks a lot of questions, often uses analogies to explain thoughts",
                "alignment": "Neutral Good",
                "goal": "to uncover hidden truths in the world and help others understand them",
                "fear": "being wrong in a critical moment or leading someone astray",
                "fatalFlaw": "tends to overthink and miss opportunities due to analysis paralysis",
                "backstory": "Raised by a scientist and a schoolteacher in a tech-savvy town, Max grew up asking 'why' about everything. After solving a major local mystery as a teen, he became obsessed with understanding systems—social, mechanical, and emotional.",
                "occupation": "information broker and freelance investigator",
                "location": "a cozy apartment above a busy bookstore in the heart of a futuristic city",
                "appearance": "slim build, tousled dark hair, round glasses, and always seen carrying a digital notepad",
                "archetype": "The Thinker",
                "images": [
                    {
                        "emotionType": "happy",
                        "file": {
                            "createdAt": "2025-08-09T18:18:12.781Z",
                            "fileName": "square_happy.jpg",
                            "src": "happy____78533ae5-4f1d-4c74-8cec-65ec78d9dde0____square_happy.jpg",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "dbFileType": "image"
                        }
                    },
                    {
                        "emotionType": "excited",
                        "file": {
                            "createdAt": "2025-08-09T18:18:17.020Z",
                            "fileName": "square_excited.jpg",
                            "src": "excited____91fdd2fa-2e9e-45be-b7ba-69352ac9effe____square_excited.jpg",
                            "status": "uploaded",
                            "uploadedAlready": true,
                            "dbFileType": "image"
                        }
                    }
                ],
                "charactersToEmotions": [
                    {
                        "simpleId": "e0869e87-752b-43af-b8a6-d3cdabf18a00",
                        "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                        "emotionType": "excited"
                    },
                    {
                        "simpleId": "7533a35d-d759-4e3a-b700-4f307612362a",
                        "characterId": "c046ca3a-31fc-4bc5-bea5-ba522e3c61c8",
                        "emotionType": "happy"
                    }
                ]
            }
        },
        {
            "simpleId": "c6bfa0f9-f6cb-469b-963e-0188e96bf10b",
            "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
            "projectId": "fc5aba52-55ed-46fe-8fe4-169c6bf1e2a1",
            "character": {
                "id": "89b09350-30f5-4c85-a553-064e69706f26",
                "name": "kim",
                "age": 26,
                "userId": "c39a84cd-746e-470b-875e-27ce02ee78fa",
                "voiceId": "rCmVtv8cYU60uhlsOo1M",
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
                "appearance": "short, spiky pink hair, eclectic clothing full of bright patterns, and an infectious smile",
                "archetype": "The Free Spirit",
                "images": [],
                "charactersToEmotions": [
                    {
                        "simpleId": "befff823-4080-484e-b2e1-8a5759428a56",
                        "characterId": "89b09350-30f5-4c85-a553-064e69706f26",
                        "emotionType": "excited"
                    }
                ]
            }
        }
    ]
}


app.beginUndoGroup("Import project");

//clear all
clearProject()

var mainComp = app.project.items.addComp("main", 1920, 1080, 1, 1 * 60 * 60, 60); //make 1hr

var projectBaseDir = "C:/Users/max/Downloads" + "/" + seenProject.name;
var charactersDirName = "characters";
var projectDirName = "project";
var audioDirName = "audio";

var currentTime = 0

for (var sceneIndex = 0; sceneIndex < seenProject.scenes.length; sceneIndex++) {
    var eachScene = seenProject.scenes[sceneIndex];

    for (var dialogueIndex = 0; dialogueIndex < eachScene.dialogue.length; dialogueIndex++) {
        var eachDialogue = eachScene.dialogue[dialogueIndex];
        var seenAlterDialogueObj = seenProject.alterDialogueObj[eachDialogue.id];

        //ensure seenAlterDialogueObj is there for each dialogue
        if (seenAlterDialogueObj === undefined) {
            throw new Error("not seeing seenAlterDialogueObj for " + eachDialogue.id)
        }

        var dialogueAudioPath = projectBaseDir + "/" + projectDirName + "/" + audioDirName + "/" + seenAlterDialogueObj.audioFileNameArray[seenAlterDialogueObj.variationIndex];
        var dialogueAudioFile = File(dialogueAudioPath);

        //Ensure file exists
        if (!dialogueAudioFile.exists) {
            throw new Error("Audio file not found: " + dialogueAudioPath);
        }

        var imported = app.project.importFile(new ImportOptions(dialogueAudioFile));

        //add to the comp
        var layer = mainComp.layers.add(imported);

        //set the in point
        layer.startTime = currentTime;

        //update current Time
        currentTime += imported.duration
    }
}

//open comp
mainComp.openInViewer();

app.endUndoGroup();


//import file example
// var file = File("C:/path/to/your/file.mp4");
// app.project.importFile(new ImportOptions(file));



//clear all
function clearProject() {
    var items = app.project.items;
    for (var i = items.length; i >= 1; i--) { // loop backwards to avoid index shift
        items[i].remove();
    }
}
























// var window = new Window("palette", "My Script", undefined);
// window.orientation = "column";

// var text = window.add("statictext", undefined, "Some Example Text");

// var buttonGroup = window.add("group", undefined, "buttonGroup");
// buttonGroup.orientation = "row";
// var buttonOne = buttonGroup.add("button", undefined, "Button 1");
// var buttonTwo = buttonGroup.add("button", undefined, "Button 2");

// var dropdown = window.add("dropdownlist", undefined, ["DD Item 1", "DD Item 2"]);
// dropdown.size = [170, 25];
// dropdown.selection = 0;
// dropdown.add("item", "DD Item 3");

// var boxesPanel = window.add("panel", undefined, "Boxes");
// boxesPanel.orientation = "row";
// var radio = boxesPanel.add("radiobutton", undefined, "Radio Text");
// var checkbox = boxesPanel.add("checkbox", undefined, "Checkbox Text");

// var slider = window.add("slider", undefined, "");

// buttonOne.onClick = function () {
//     compAndLayerFunction();
// }

// buttonTwo.onClick = function () {
//     importFileAndStuff();
// }

// window.center();
// window.show();

// // Comp/Layer Stuff
// function compAndLayerFunction() {
//     if (app.project.activeItem == null || !(app.project.activeItem instanceof CompItem)) {
//         alert("Please select a composition first");
//         return false;
//     }

//     app.beginUndoGroup("Process");

//     var composition = app.project.activeItem;

//     var selectedLayer = composition.layer(1);
//     // var layer = composition.layer(1);
//     // .property("Position")
//     var positionValue = selectedLayer.property("ADBE Transform Group").property("ADBE Position").value;
//     alert(positionValue);
//     selectedLayer.property("ADBE Transform Group").property("ADBE Scale").expression = 'wiggle(.3, 50)';

//     composition.width *= .5;
//     composition.height *= .5;
//     composition.name = "Resized Composition";

//     var exposureEffect = selectedLayer.Effects.addProperty("ADBE Exposure2");
//     // layer.effect(1)
//     // layer.effect(1).property(2)
//     exposureEffect.property(3).setValue(1);

//     app.endUndoGroup();
// }

// // Import/Other Stuff
// function importFileAndStuff() {
//     var videoFile = File("~/Videos/test.mp4");
//     var videoItem = app.project.importFile(new ImportOptions(videoFile));

//     var videoLayer;

//     for (var i = 1; i <= 5; i++) {
//         videoLayer = app.project.activeItem.layers.add(videoItem);
//         videoLayer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(i, 0);
//         videoLayer.property("ADBE Transform Group").property("ADBE Opacity").setValueAtTime(i + 1, 100);
//     }

//     app.project.renderQueue.items.add(app.project.activeItem);

//     //app.project.renderQueue.render();

// }