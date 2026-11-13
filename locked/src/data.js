// ---------- Static demo data ----------
// Course list: a sample of the Stanford catalog. The production app syncs the full
// ExploreCourses catalog (every course, every year) into the database nightly.
const COURSES = [
 ["CS 103","Mathematical Foundations of Computing"],["CS 105","Introduction to Computers"],["CS 106A","Programming Methodology"],["CS 106B","Programming Abstractions"],["CS 106L","Standard C++ Programming Laboratory"],["CS 107","Computer Organization and Systems"],["CS 109","Introduction to Probability for Computer Scientists"],["CS 111","Operating Systems Principles"],["CS 124","From Languages to Information"],["CS 129","Applied Machine Learning"],["CS 131","Computer Vision: Foundations and Applications"],["CS 142","Web Applications"],["CS 143","Compilers"],["CS 144","Introduction to Computer Networking"],["CS 145","Data Management and Data Systems"],["CS 147","Introduction to Human-Computer Interaction Design"],["CS 149","Parallel Computing"],["CS 154","Introduction to the Theory of Computation"],["CS 155","Computer and Network Security"],["CS 157","Computational Logic"],["CS 161","Design and Analysis of Algorithms"],["CS 166","Data Structures"],["CS 168","The Modern Algorithmic Toolbox"],["CS 181","Computers, Ethics, and Public Policy"],["CS 193P","iPhone and iPad Application Programming"],["CS 194","Software Project"],["CS 197","Computer Science Research"],["CS 221","Artificial Intelligence: Principles and Techniques"],["CS 224N","Natural Language Processing with Deep Learning",["LINGUIST 284"]],["CS 224W","Machine Learning with Graphs"],["CS 229","Machine Learning",["STATS 229"]],["CS 230","Deep Learning"],["CS 231N","Deep Learning for Computer Vision"],["CS 234","Reinforcement Learning"],["CS 236","Deep Generative Models"],["CS 238","Decision Making under Uncertainty",["AA 228"]],["CS 246","Mining Massive Data Sets"],
 ["MATH 19","Calculus"],["MATH 20","Calculus"],["MATH 21","Calculus"],["MATH 51","Linear Algebra, Multivariable Calculus, and Modern Applications"],["MATH 52","Integral Calculus of Several Variables"],["MATH 53","Differential Equations with Linear Algebra, Fourier Methods, and Modern Applications"],["MATH 104","Applied Matrix Theory"],["MATH 113","Linear Algebra and Matrix Theory"],["MATH 115","Functions of a Real Variable"],["MATH 120","Groups and Rings"],["MATH 151","Introduction to Probability Theory"],["MATH 171","Fundamental Concepts of Analysis"],
 ["CME 100","Vector Calculus for Engineers"],["CME 102","Ordinary Differential Equations for Engineers"],["CME 106","Introduction to Probability and Statistics for Engineers"],
 ["STATS 60","Introduction to Statistical Methods: Precalculus"],["STATS 116","Theory of Probability"],["STATS 191","Introduction to Applied Statistics"],["STATS 200","Introduction to Statistical Inference"],["STATS 202","Data Mining and Analysis"],["STATS 203","Introduction to Regression Models and Analysis of Variance"],
 ["ECON 1","Principles of Economics"],["ECON 50","Economic Analysis I"],["ECON 51","Economic Analysis II"],["ECON 52","Economic Analysis III"],["ECON 102A","Introduction to Statistical Methods (Postcalculus) for Social Scientists"],["ECON 102B","Applied Econometrics"],["ECON 111","Money and Banking"],["ECON 140","Introduction to Financial Economics"],
 ["CHEM 31A","Chemical Principles I"],["CHEM 31B","Chemical Principles II"],["CHEM 33","Structure and Reactivity of Organic Molecules"],["CHEM 171","Foundations of Physical Chemistry"],
 ["BIO 82","Genetics"],["BIO 83","Biochemistry & Molecular Biology"],["BIO 84","Physiology"],["BIO 85","Evolution"],["BIO 86","Cell Biology"],["HUMBIO 2A","Genetics, Evolution, and Ecology"],["HUMBIO 3A","Cell and Developmental Biology"],["HUMBIO 4A","The Human Organism"],
 ["PHYSICS 41","Mechanics"],["PHYSICS 43","Electricity and Magnetism"],["PHYSICS 45","Light and Heat"],["PHYSICS 61","Mechanics and Special Relativity"],
 ["ENGR 14","Intro to Solid Mechanics"],["ENGR 40M","An Intro to Making: What is EE"],["ENGR 50","Introduction to Materials Science, Nanotechnology Emphasis"],["ENGR 62","Introduction to Optimization",["MS&E 111"]],["ENGR 108","Introduction to Matrix Methods"],["EE 101A","Circuits I"],["EE 102A","Signal Processing and Linear Systems I"],["EE 108","Digital System Design"],["EE 178","Probabilistic Systems Analysis"],["EE 364A","Convex Optimization I"],["MS&E 178","The Spirit of Entrepreneurship"],["ME 30","Engineering Thermodynamics"],
 ["PSYCH 1","Introduction to Psychology"],["PSYCH 50","Introduction to Cognitive Neuroscience"],["PSYCH 60","Introduction to Developmental Psychology"],["PSYCH 70","Self and Society: Introduction to Social Psychology"],["SYMSYS 1","Minds and Machines"],["PHIL 1","Introduction to Philosophy"],["PHIL 80","Mind, Matter, and Meaning"],["PWR 1","Writing & Rhetoric 1"],["PWR 2","Writing & Rhetoric 2"],["EARTHSYS 10","Introduction to Earth Systems"]
].map(([code,title,cross])=>({code,title,cross:cross||[],kind:"course"}));
const EXTRA_TAGS = ["MCAT","LSAT","GRE","GMAT","Research","Thesis","Internship prep","Coding interviews","General","Reading"].map(t=>({code:t,title:"Non-course tag",cross:[],kind:"tag"}));
const ALL_TAGS = COURSES.concat(EXTRA_TAGS);
function findTag(code){ return ALL_TAGS.find(c=>c.code===code||c.cross.includes(code)) }
const TERM = "Autumn 2026";

const USERS = {
 me:{id:"me",name:"You",handle:"you",color:"#7B5CFF"},
 maya:{id:"maya",name:"Maya Chen",handle:"mayac",color:"#FF5B3A",dorm:"Branner"},
 jordan:{id:"jordan",name:"Jordan Okafor",handle:"jokafor",color:"#10B27F",dorm:"FroSoCo"},
 priya:{id:"priya",name:"Priya Raman",handle:"priyar",color:"#A24BFF",dorm:"Roble"},
 leo:{id:"leo",name:"Leo Martínez",handle:"leom",color:"#FFB81F",dorm:"Lagunita"},
 sam:{id:"sam",name:"Sam Whitfield",handle:"samw",color:"#0FA3C9",dorm:"Wilbur"},
 ava:{id:"ava",name:"Ava Kim",handle:"avakim",color:"#E5374F",dorm:"Stern"},
 diego:{id:"diego",name:"Diego Alvarez",handle:"dalvarez",color:"#6B7BFF",dorm:"Crothers"},
 noor:{id:"noor",name:"Noor Haddad",handle:"noorh",color:"#D46B00",dorm:"Toyon"},
 ethan:{id:"ethan",name:"Ethan Brooks",handle:"ebrooks",color:"#2E9E5B",dorm:"Lantana"},
 zoe:{id:"zoe",name:"Zoe Park",handle:"zoep",color:"#C2378F",dorm:"Branner"},
 ben:{id:"ben",name:"Ben Lowe",handle:"benl",color:"#5A6A8A"},
 isla:{id:"isla",name:"Isla Nguyen",handle:"islan",color:"#008C7A"},
 marcus:{id:"marcus",name:"Marcus Reed",handle:"mreed",color:"#9A5B2E"},
 hana:{id:"hana",name:"Hana Sato",handle:"hanas",color:"#E0569B"},
};
// Study spots. Coordinates come from Stanford's campus-map points of interest (building centroids).
const SPOTS = [
 {id:"green",name:"Green Library",ll:[37.42673,-122.16678],below:true},
 {id:"bender",name:"Bender Room (Bing Wing)",short:"Bender Room",ll:[37.42691,-122.16760]},
 {id:"lathrop",name:"Lathrop Library",ll:[37.42922,-122.16730]},
 {id:"huang",name:"Huang Engineering Center",short:"Huang",ll:[37.42797,-122.17427]},
 {id:"gates",name:"Gates Computer Science",short:"Gates",ll:[37.43011,-122.17342]},
 {id:"y2e2",name:"Coupa Café, Y2E2",short:"Y2E2",ll:[37.42834,-122.17554]},
 {id:"lima",name:"Li & Ma Science Library",short:"Li & Ma Library",ll:[37.43066,-122.17144]},
 {id:"branner",name:"Branner Earth Sciences Library",short:"Branner Library",ll:[37.42642,-122.17265]},
 {id:"tresidder",name:"Tresidder Union & CoHo",short:"Tresidder",ll:[37.42424,-122.17093]},
 {id:"law",name:"Crown Law Library",short:"Law Library",ll:[37.42405,-122.16772]},
 {id:"gsb",name:"Knight Management Center",short:"GSB",ll:[37.42857,-122.16219]},
 {id:"lane",name:"Lane Medical Library",short:"Lane Library",ll:[37.43253,-122.17553]},
 {id:"arrillaga",name:"Arrillaga Family Dining Commons",short:"Arrillaga Dining",ll:[37.42540,-122.16406]},
 {id:"artlib",name:"Art & Architecture Library",short:"Art Library",ll:[37.43255,-122.17172]},
];
// Street lines traced through Marguerite shuttle stops on each street (same campus-map source).
const STREETS = {
 "Jane Stanford Way":[[37.43025,-122.17594],[37.42966,-122.17249],[37.42899,-122.17008],[37.42893,-122.16916],[37.42852,-122.16789],[37.42854,-122.16718],[37.42824,-122.16639],[37.42796,-122.16464],[37.42771,-122.16412],[37.42759,-122.16289],[37.42721,-122.16115],[37.42694,-122.16037]],
 "Campus Drive":[[37.43075,-122.17801],[37.43103,-122.17916],[37.43021,-122.18029],[37.42975,-122.18031],[37.42856,-122.1807],[37.42803,-122.18112]],
 "Campus Drive East":[[37.43078,-122.17635],[37.43251,-122.17365],[37.43084,-122.16328],[37.42864,-122.16053],[37.42812,-122.16053],[37.42628,-122.15975],[37.42472,-122.16022],[37.42377,-122.16083],[37.42255,-122.16208],[37.42234,-122.16372],[37.42265,-122.16387],[37.42297,-122.16544],[37.42264,-122.16595],[37.42163,-122.16823]],
 "Santa Teresa St":[[37.42662,-122.18053],[37.4261,-122.17692],[37.42584,-122.17629],[37.42526,-122.1735]],
 "Via Ortega":[[37.43025,-122.17594],[37.42886,-122.17598],[37.42852,-122.17621],[37.4261,-122.17692]],
 "Roth Way":[[37.43251,-122.17365],[37.43231,-122.17266],[37.43191,-122.17074]],
 "Galvez St":[[37.43196,-122.16391],[37.43701,-122.16114]],
};
const LANDMARKS = [
 {name:"Main Quad",ll:[37.42750,-122.17030],box:[[37.42660,-122.17180],[37.42860,-122.16880]]},
 {name:"Hoover Tower",ll:[37.42761,-122.16696],dot:true},
 {name:"The Oval",ll:[37.42950,-122.16900],dot:false},
 {name:"Stanford Stadium",ll:[37.43468,-122.16115],dot:true},
 {name:"Medical Center",ll:[37.43360,-122.17401],dot:false},
];
const HOME_SPOT = {id:"home",name:"Home / dorm (private)",private:true};
const CAMPUS = [37.4280,-122.1700];

const SONGS = [
 ["Weightless","Marconi Union"],["Experience","Ludovico Einaudi"],["Nuvole Bianche","Ludovico Einaudi"],["Sunset Lover","Petit Biscuit"],["Intro","The xx"],["Midnight City","M83"],["Time","Hans Zimmer"],["Clair de Lune","Claude Debussy"],["Gymnopédie No. 1","Erik Satie"],["Redbone","Childish Gambino"],["Pink + White","Frank Ocean"],["Holocene","Bon Iver"],["Space Song","Beach House"],["Electric Feel","MGMT"],["505","Arctic Monkeys"],["Kids","MGMT"],["Breathe","Télépopmusik"],["Motion Picture Soundtrack","Radiohead"],["Saturn","SZA"],["Cornfield Chase","Hans Zimmer"]
].map(([t,a])=>({t,a}));

const REEL_PROMPTS = [
 "Show us your study setup in 5 seconds","Your face when the pset is due at 11:59","Impersonate your TA explaining a proof","Best study snack. Go.","Your victory dance after a midterm","Explain your major in three words","Recreate the moment it finally clicked","Lead us in one 10-second stretch","What your brain sounds like during finals","Rate your study spot out of 10"
];
const CHAT_SEEDS = {
 "CS 161":[["priya","anyone else stuck on 3b? the recurrence won't telescope for me"],["leo","try writing out the first 3 levels of the tree, it clicks"],["sam","Lock-in session at Huang 7pm if anyone wants company",{invite:{spot:"huang",time:"7:00 PM",going:["sam","priya","leo"]}}],["maya","what's covered on the midterm, through lecture 9?"],["jordan","yes, 1–9 plus the master theorem handout"]],
 "MATH 51":[["noor","is there a review session for the midterm?"],["ava","Thursday 6pm in 200-002 I think"],["zoe","Which topics are you most worried about?",{poll:{opts:["Eigenvectors","Chain rule","Lagrange"],votes:[4,2,6]}}]],
 "PSYCH 1":[["diego","the reading for week 8 is long, anyone want to split notes? (summaries only, no assignment answers)"],["ethan","in, I'll take ch. 11"]]
};
const DM_SEEDS = [
 {id:"dm_maya",with:["maya"],msgs:[["maya","are you locking in at green tonight?"],["me","yeah after dinner, 7ish"],["maya","bet, saving you a seat in bender"]]},
 {id:"dm_grp",name:"161 study crew",with:["priya","leo","sam"],msgs:[["leo","pset 5 is out"],["priya","noooo"],["sam","huang 7pm, lock in"]]},
];
