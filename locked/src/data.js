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
 me:{id:"me",name:"You",handle:"you",color:"#2D5BFF"},
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
// Map coordinates are on a 1000x1080 stylized campus drawing, north up.
const SPOTS = [
 {id:"green",name:"Green Library",x:640,y:470,ll:[37.4269,-122.1670]},
 {id:"bender",name:"Bender Room (Green)",x:662,y:440,ll:[37.4271,-122.1667]},
 {id:"lathrop",name:"Lathrop Library",x:775,y:480,ll:[37.4270,-122.1655]},
 {id:"huang",name:"Huang Engineering Center",x:340,y:420,ll:[37.4277,-122.1745]},
 {id:"gates",name:"Gates Computer Science",x:285,y:500,ll:[37.4300,-122.1730]},
 {id:"y2e2",name:"Coupa Café, Y2E2",x:395,y:340,ll:[37.4285,-122.1754]},
 {id:"tresidder",name:"Tresidder Union",x:560,y:660,ll:[37.4244,-122.1707]},
 {id:"coho",name:"CoHo (Old Union)",x:470,y:620,ll:[37.4250,-122.1700]},
 {id:"meyer",name:"Meyer Green",x:600,y:575,ll:[37.4257,-122.1676]},
 {id:"law",name:"Crown Law Library",x:800,y:640,ll:[37.4238,-122.1667]},
 {id:"gsb",name:"Knight Management Center",x:915,y:700,ll:[37.4284,-122.1617]},
 {id:"lane",name:"Lane Medical Library",x:330,y:175,ll:[37.4318,-122.1756]},
 {id:"arrillaga",name:"Arrillaga Family Dining",x:250,y:720,ll:[37.4254,-122.1785]},
 {id:"cantor",name:"Cantor Arts Center",x:690,y:300,ll:[37.4332,-122.1703]},
];
const HOME_SPOT = {id:"home",name:"Home / dorm (private)",private:true};
const CAMPUS = [37.4275,-122.1697];

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
