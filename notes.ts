//To Do
//make starting value for active character clothing obj - give context to story generation...
//make sure prompt to gpt is detailed, take in active clothing, appearance, focus...
//then build generate images for each scene - download to server
//move on to after effects
//build out audio, text, images for the story - each scene, each dialogue
//figure out after effects
//make a timeline
//generate images for characters, generate background images
//update prompt so gpt knows how to build clothes object for each scene
//ensure every scene errors if not seeing activeCharacterClothing
//provde activecharacter clothing for each story and each scene
//maybe refine activecharacter make scenes




//ideas
//more details on base character to ensure precise images..., has different clothing options and reference images...
//each scene stores active clothing for characters - start off with default selection, can be changed...
//super detailed prompt goes to gpt for story - generates all scenes, with active clothes selected for each user
//then generate all images at once, use the clothing id and reference image for best generation //not sure
//every scene has an image, audio and dialogue text - order them in after effects
//character folder in uploaded data holds reference images
//scene images are in projects folder by id
//
//
//
//
//




//notes
//remember to sync env variables

//naming
//schema - plural
//type - singular with Type added - e.g userType
//serverFunctions - handlePlural e.g handleUsers - singular function names - e.g addUser - getAll remains plural - e.g getUsers
//api routes - container name first - then verb. e.g projects - download, files - upload