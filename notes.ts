//To Do
//by default responses api
//save response id - if user wants context
//hen if edit an image - user upload edited image along with prompt - temp dir
//user generate image prompt
//user edit image from file uploaded

//allow user to make image/edit from prompt
//find way to pass reference images to this generation
//allow location views generation - test - then upload scenes found online
//location selector for project - need location to projects db - dynamically chooses the best scenes for story progression
//each scene sends up the view's reference image
//if not seeing view set as default - each location needs at least 1 view
//if not seeing location show setter
//make forest: entrance, deep, oasis, exit
//each character has active appearance along with defining description. upload that and reference images (view/character) along with visual instructions from scene - remove the condenser

//canvas dimensions - sets after effects, and image
//move all data to uploaded data - staging, rename previews/images
//one way to change active appearance - projectsToCharacters
//same way to change location on projectsToLocations
//options to choose input fidelity and image size, quality
//make prompts on addedit character/location editable - make add variables to prompt in utility
//use same upload file logic across app
//fix objwithFile bug - still validates deleted array - dont allow delete if invalid
//refine image preview gpt with central generation, multi context from options - uploading reference images
//fix add edit character with form obj error check




//Ideas
//back to square 1
//generate story makes scenes
//it has active appearance and context of reference images
//from their it generates 10 scenes at a time. with images
//can manually add scenes - thats it
//possibility to pass a scene as reference to continue same scene generation
//
//
//

//long term - 3d game

//now - specific prompt generation
//art style set at project layer - water color, strong lines
//make scene instructions - used to generate visually - max standing off to the side, kim talking - refine
//each character has active appearance along with defining description. upload that and reference image
//generate locations - same as below
//each scene happens at location - send up location reference image - make db - description, what it looks like

//now - make dynamic characters/scenes ahead of time
//scenes - each scene is at a location. e.g Max house. Then the variation of the location. e.g summer, christmas...etc. Then the view: front door, bedroom, kitchen - build a library of scenes over time
//each scene has position marker where characters/events can take place at - use this to position characters/determine layering. This determins scale of character at that position marker as well.
////
//characters - Every character has different appearance options. (character is specific to age, interestes personality. 8 yo MAx, diff character from 24 yo max.)
//each appearance has different poses - walking, reaching up, standing facing camera...etc find the best ones to support character
//choose the character pose at a specifc event marker in a scene.
////
//display these options in your canvas. Then output as is to after effects
//all characters/scenes keep 1-1 sizing in mind. 1000px = 10m or something




//Notes
//remember to sync env variables

//naming
//schema - plural
//type - singular with Type added - e.g userType
//serverFunctions - handlePlural e.g handleUsers - singular function names - e.g addUser - getAll remains plural - e.g getUsers
//api routes - container name first - then verb. e.g projects - download, files - upload
//generate apeparance description
//auto upload image




//To Do completed
//project default values setter...
//set art style at project layer - water color, strong lines...
//remove prompt set at start, make default - addedit projects...
//each scene has visual instructions - dont worry about appearance, just what the characters are doing in a given scene. e.g max standing off to the side, kim talking
//set prompt for visual appearance...
//test it works...
//generate locations in db...
//every location has a name, description and views e.g max house...
//each view has a name (e.g front door, bedroom), reference image and locationVariationName: e.g summer house, winter house...
//locations - server action..., add edit..., view...














