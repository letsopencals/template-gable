/**
 * Site configuration — copy and presentation only.
 *
 * Everything bookable (houses, spaces, seats, prices, extras, availability) comes from the Opencals store. This file
 * holds the words around it: the brand, how each store collection is presented as a *kind* of space, the per-house
 * notes the API has no field for (arrival, Wi-Fi, getting there), and the homepage/content-page copy.
 * Images are paths under /public; a missing file falls back to a drawn placeholder.
 */

/** The kinds of bookable space. A store collection maps to exactly one kind. */
export type KindKey = 'flex' | 'desk' | 'room' | 'booth' | 'studio' | 'event' | 'office';

export interface KindConfig {
	key: KindKey;
	/** Store collection slug */
	collection: string;
	/** Singular / plural labels */
	label: string;
	plural: string;
	/** Content page for the kind */
	href: string;
	/** Sheet number prefix used on that page */
	sheet: string;
	tagline: string;
	blurb: string;
	/** What the price is per, for display ("half day", "30 min") — the real unit comes from the product duration */
	unitHint: string;
	image: string;
	/** Bullets for the kind page */
	includes: string[];
	/** Default booking length in minutes when this kind is chosen in the planner */
	defaultLengthMin: number;
	/** Length chips offered in the planner, in minutes (clipped to each space's max) */
	lengths: number[];
}

export const kinds: KindConfig[] = [
	{
		key: 'flex',
		collection: 'flex-desks',
		label: 'Flex desk',
		plural: 'Flex desks',
		href: '/desks',
		sheet: 'DK',
		tagline: 'Any seat on the open floor.',
		blurb: 'Turn up, pick a seat by the window, plug in. Half a day or the whole day, with coffee, fast Wi-Fi and phone booths a few steps away.',
		unitHint: 'half day',
		image: '/images/spaces/dock-house-flex.jpg',
		includes: ['Any free seat on the open floor', 'Gigabit Wi-Fi and wired ports', 'Barista coffee, tea and fruit', 'Phone booths and quiet room', 'Printing on request'],
		defaultLengthMin: 480,
		lengths: [240, 480, 720],
	},
	{
		key: 'desk',
		collection: 'studio-desks',
		label: 'Studio desk',
		plural: 'Studio desks',
		href: '/desks#studio',
		sheet: 'DK',
		tagline: 'Your own desk for the day.',
		blurb: 'A named desk in the quiet studio with a 27" monitor, a proper task chair and a locker. Book the same one every week if you like it.',
		unitHint: 'half day',
		image: '/images/spaces/smithfield-studio-desk.jpg',
		includes: ['A named desk, just yours', '27" monitor and USB-C dock', 'Ergonomic task chair', 'Day locker', 'Quiet studio, no calls'],
		defaultLengthMin: 480,
		lengths: [240, 480, 720],
	},
	{
		key: 'room',
		collection: 'meeting-rooms',
		label: 'Meeting room',
		plural: 'Meeting rooms',
		href: '/meeting-rooms',
		sheet: 'MR',
		tagline: 'Rooms for four to sixteen.',
		blurb: 'Daylit rooms with a screen, a video bar and a whiteboard wall. Book by the half hour, add coffee or lunch, and invite your guests from the booking.',
		unitHint: '30 min',
		image: '/images/spaces/dock-house-liffey.jpg',
		includes: ['Screen with one-cable connection', 'Video bar for hybrid calls', 'Whiteboard wall', 'Guests signed in at reception', 'Catering to the room'],
		defaultLengthMin: 60,
		lengths: [30, 60, 90, 120, 180, 240, 480],
	},
	{
		key: 'booth',
		collection: 'phone-booths',
		label: 'Phone booth',
		plural: 'Phone booths',
		href: '/meeting-rooms#booths',
		sheet: 'MR',
		tagline: 'A quiet box for one call.',
		blurb: 'Acoustic booths for calls and interviews, with a light, a fan, a shelf for your laptop and a door that actually closes.',
		unitHint: '30 min',
		image: '/images/spaces/dock-house-booth.jpg',
		includes: ['Fully enclosed, ventilated', 'Laptop shelf and power', 'Ring light', 'Bookable from 30 minutes'],
		defaultLengthMin: 30,
		lengths: [30, 60, 90, 120],
	},
	{
		key: 'studio',
		collection: 'studios',
		label: 'Studio',
		plural: 'Studios',
		href: '/studios',
		sheet: 'ST',
		tagline: 'Record, shoot, publish.',
		blurb: 'A treated sound room for podcasts in Smithfield and a north-lit photo studio in Cork. Book by the hour, bring a sound engineer if you want one.',
		unitHint: 'hour',
		image: '/images/spaces/smithfield-sound-room.jpg',
		includes: ['Treated room, broadcast mics', 'Paper backdrops and flash kit (photo)', 'Engineer on request', 'Files on a drive before you leave'],
		defaultLengthMin: 120,
		lengths: [60, 120, 180, 240, 480],
	},
	{
		key: 'event',
		collection: 'event-spaces',
		label: 'Event space',
		plural: 'Event spaces',
		href: '/events',
		sheet: 'EV',
		tagline: 'Launches, offsites, long tables.',
		blurb: 'A roof terrace over Grand Canal Dock and a long stone workshop room in Galway. Half or full days, with a barista bar and food from our kitchen partners.',
		unitHint: 'half day',
		image: '/images/spaces/dock-house-roof-terrace.jpg',
		includes: ['Up to 60 standing / 40 seated', 'PA, mics and a big screen', 'Barista bar and catering', 'A host from the house team'],
		defaultLengthMin: 240,
		lengths: [240, 480, 720],
	},
	{
		key: 'office',
		collection: 'private-offices',
		label: 'Day office',
		plural: 'Day offices',
		href: '/day-offices',
		sheet: 'DO',
		tagline: 'A lockable room for your team, today.',
		blurb: 'A private office for four or six with its own door, screen and whiteboard. For a sprint, an audit week or a visiting team.',
		unitHint: 'half day',
		image: '/images/spaces/dock-house-office-3.jpg',
		includes: ['Lockable door, key at reception', 'Desks, chairs, screen and whiteboard', 'Use of the whole house', 'Mail and guests handled at the desk'],
		defaultLengthMin: 480,
		lengths: [240, 480, 720],
	},
];

export const kindByKey = (k: KindKey) => kinds.find((x) => x.key === k)!;
export const kindByCollection = (slug: string) => kinds.find((x) => x.collection === slug) ?? null;

/** Per-house presentation, matched to a store location by slug (fallback: city/title, case/accent-insensitive). */
export interface HousePresentation {
	match: string[];
	short: string;
	neighbourhood: string;
	line: string;
	story: string;
	image: string;
	gallery: string[];
	hours: { days: string; time: string }[];
	phone: string;
	gettingThere: string[];
	arrival: string;
	wifi: string;
	amenities: string[];
}

export const houses: HousePresentation[] = [
	{
		match: ['dock-house', 'dock house', 'grand canal'],
		short: 'Dock House',
		neighbourhood: 'Grand Canal Dock, Dublin 2',
		line: 'The flagship: a granite warehouse on the water, with a roof terrace.',
		story: 'Built in 1820 to store grain off the canal barges, Dock House has two-foot granite walls and timber trusses we left exactly where they were. Five floors of desks and rooms, a booth on every landing, and a roof terrace that looks over the basin to the Aviva.',
		image: '/images/houses/dock-house.jpg',
		gallery: ['/images/gallery/roof-terrace.jpg', '/images/spaces/dock-house-liffey.jpg'],
		hours: [
			{ days: 'Mon–Fri', time: '08:00–20:00' },
			{ days: 'Sat', time: '09:00–17:00' },
		],
		phone: '+353 1 555 0140',
		gettingThere: ['DART: Grand Canal Dock, 3 min walk', 'Luas Red line: George’s Dock, 12 min', 'Dublin Bikes station 46 at the door', 'Parking: 20 spaces under the building (book as an extra)'],
		arrival: 'Come in through the glass door on the quay side. Reception is on the left; say your name and we’ll walk you up.',
		wifi: 'Network “Gable”, guests sign in with the booking email.',
		amenities: ['Roof terrace', 'Barista bar', 'Bike storage', 'Showers', 'Parking', 'Step-free access'],
	},
	{
		match: ['smithfield'],
		short: 'Smithfield',
		neighbourhood: 'Smithfield, Dublin 7',
		line: 'An old whiskey bonded store with brick vaults and a sound room.',
		story: 'The casks are gone but the brick vaults stayed. Smithfield is our quietest house: the open floor sits under barrel-vaulted ceilings, and the old cooperage is now a treated sound room for podcasts.',
		image: '/images/houses/smithfield.jpg',
		gallery: ['/images/gallery/podcast.jpg', '/images/spaces/smithfield-bonded.jpg'],
		hours: [
			{ days: 'Mon–Fri', time: '08:00–20:00' },
			{ days: 'Sat', time: '09:00–17:00' },
		],
		phone: '+353 1 555 0177',
		gettingThere: ['Luas Red line: Smithfield, 1 min walk', 'Heuston Station, 12 min walk', 'Dublin Bikes station 88 on the square'],
		arrival: 'The entrance is on the square under the copper lantern. Reception is straight ahead, past the bikes.',
		wifi: 'Network “Gable”, guests sign in with the booking email.',
		amenities: ['Sound room', 'Barrel-vault floor', 'Bike storage', 'Showers', 'Step-free access'],
	},
	{
		match: ['portobello'],
		short: 'Portobello',
		neighbourhood: 'Portobello, Dublin 8',
		line: 'A Georgian townhouse on the canal, with a garden room.',
		story: 'Four storeys of tall sash windows on the Grand Canal. Portobello feels like working in a friend’s very good house: a parlour, a drawing room, desks on the upper floors, and a garden room at the back for small meetings.',
		image: '/images/houses/portobello.jpg',
		gallery: ['/images/spaces/portobello-garden-room.jpg', '/images/spaces/portobello-drawing-room.jpg'],
		hours: [
			{ days: 'Mon–Fri', time: '08:00–20:00' },
			{ days: 'Sat', time: '09:00–17:00' },
		],
		phone: '+353 1 555 0119',
		gettingThere: ['Luas Green line: Harcourt, 8 min walk', 'Buses 14, 15, 65, 83 to Rathmines Road', 'Canal towpath for cyclists'],
		arrival: 'Ring the bell at the black door with the brass fanlight. The garden room is through the house and down three steps.',
		wifi: 'Network “Gable”, guests sign in with the booking email.',
		amenities: ['Garden room', 'Canal views', 'Kitchen', 'Bike rail'],
	},
	{
		match: ['harbour', 'dun laoghaire', 'dún laoghaire'],
		short: 'Harbour',
		neighbourhood: 'Dún Laoghaire, Co. Dublin',
		line: 'Seafront desks, a pier walk at lunch and sea-swim showers.',
		story: 'Desks facing the harbour mouth and the ferries. Take a call on the East Pier, swim at the Forty Foot before your first meeting and shower here afterwards. We keep towels.',
		image: '/images/houses/harbour.jpg',
		gallery: ['/images/gallery/sea-swim.jpg', '/images/spaces/harbour-lighthouse.jpg'],
		hours: [
			{ days: 'Mon–Fri', time: '08:00–20:00' },
			{ days: 'Sat', time: '09:00–17:00' },
		],
		phone: '+353 1 555 0163',
		gettingThere: ['DART: Dún Laoghaire, 2 min walk', 'Aircoach 703 from the airport', 'Parking: 8 spaces behind the house (book as an extra)'],
		arrival: 'We’re on the seafront opposite the East Pier. Reception is on the first floor; the lift is beside the stairs.',
		wifi: 'Network “Gable”, guests sign in with the booking email.',
		amenities: ['Sea-swim showers', 'Sea views', 'Parking', 'Bike storage', 'Step-free access'],
	},
	{
		match: ['shandon', 'cork'],
		short: 'Shandon',
		neighbourhood: 'Shandon, Cork',
		line: 'The old butter market, with a north-lit photo studio.',
		story: 'Below the bells of Shandon, in a building that once graded butter for half the world. Big floors, cast-iron columns and a north-facing daylight studio that photographers book a month ahead.',
		image: '/images/houses/shandon.jpg',
		gallery: ['/images/gallery/photo-studio.jpg', '/images/spaces/shandon-butter-exchange.jpg'],
		hours: [
			{ days: 'Mon–Fri', time: '08:00–20:00' },
			{ days: 'Sat', time: '09:00–17:00' },
		],
		phone: '+353 21 555 0122',
		gettingThere: ['Kent Station, 15 min walk', 'Bus 208 to Shandon Street', 'Parking: 10 spaces in the yard (book as an extra)'],
		arrival: 'Enter from the market yard. Reception is at the foot of the iron staircase.',
		wifi: 'Network “Gable”, guests sign in with the booking email.',
		amenities: ['Daylight photo studio', 'Parking', 'Barista bar', 'Bike storage'],
	},
	{
		match: ['spanish-arch', 'spanish arch', 'galway'],
		short: 'Spanish Arch',
		neighbourhood: 'The Quays, Galway',
		line: 'A stone quayside building with a long workshop room.',
		story: 'Limestone walls a step from the Spanish Arch, where the Corrib meets the bay. The Long Room seats forty at one table: for workshops, offsites and suppers after them.',
		image: '/images/houses/spanish-arch.jpg',
		gallery: ['/images/gallery/workshop.jpg', '/images/spaces/spanish-arch-long-room.jpg'],
		hours: [
			{ days: 'Mon–Fri', time: '08:00–20:00' },
			{ days: 'Sat', time: '09:00–17:00' },
		],
		phone: '+353 91 555 0108',
		gettingThere: ['Ceannt Station, 10 min walk', 'City buses to Eyre Square, then 8 min on foot', 'Coach from Dublin Airport to Galway Coach Station'],
		arrival: 'The door is on the quay, beside the arch. Reception is on the ground floor by the fire.',
		wifi: 'Network “Gable”, guests sign in with the booking email.',
		amenities: ['Long Room', 'Fireplace', 'River views', 'Kitchen'],
	},
];

const norm = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

/** Presentation for a store location (by slug, then title/city). */
export function housePresentation(loc: { slug?: string | null; title?: string | null; city?: string | null }): HousePresentation | null {
	const hay = [loc.slug, loc.title, loc.city].filter(Boolean).map((s) => norm(String(s)));
	return houses.find((h) => h.match.some((m) => hay.some((x) => x === norm(m) || x.includes(norm(m))))) ?? null;
}

/** Extras (store add-ons) grouped for the /extras page and the planner. Unlisted add-ons land in "more". */
export const extraGroups: { key: string; label: string; blurb: string; slugs: string[] }[] = [
	{ key: 'food', label: 'Food & drink', blurb: 'From our kitchen partners in each city, delivered to the room at the time you choose.', slugs: ['coffee-pastries', 'working-lunch', 'fruit-juice', 'barista-bar'] },
	{ key: 'kit', label: 'Kit for the room', blurb: 'Everything for a good meeting that isn’t already on the wall.', slugs: ['video-kit', 'workshop-kit', 'flowers'] },
	{ key: 'comfort', label: 'For your day', blurb: 'Small things that make a desk day better.', slugs: ['parking', 'locker', 'monitor', 'guest-pass', 'print-bundle', 'sea-swim'] },
	{ key: 'studio', label: 'Studio services', blurb: 'People and kit for the sound room and the daylight studio.', slugs: ['sound-engineer', 'edit-master', 'backdrop-kit'] },
];

export const siteConfig = {
	name: 'Gable',
	legalName: 'Gable Workspace Ltd.',
	tagline: 'Workspace across Ireland',
	description:
		'Gable runs six workspaces in old buildings across Dublin, Cork and Galway: flex and studio desks, meeting rooms, phone booths, studios, day offices and event spaces. Book any of them by the half hour, add lunch, and invite your guests.',
	url: 'https://template-gable.vercel.app',

	contact: {
		email: 'hello@gable.example',
		phone: '+353 1 555 0100',
		address: 'Dock House, 14 Hanover Quay\nDublin 2, D02 X285',
		teamsEmail: 'teams@gable.example',
	},

	social: [
		{ label: 'Instagram', href: 'https://instagram.com' },
		{ label: 'LinkedIn', href: 'https://linkedin.com' },
	],

	nav: [
		{ label: 'Houses', href: '/houses' },
		{ label: 'Extras', href: '/extras' },
		{ label: 'Pricing', href: '/pricing' },
		{ label: 'Teams', href: '/teams' },
	],

	hero: {
		kicker: 'Six houses · Dublin, Cork, Galway',
		heading: ['Work in a', 'good building.'],
		body: 'Desks, rooms, booths and studios in six old buildings we’ve restored, from a canal-side warehouse to a stone house on Galway’s quays. Book by the half hour. Lunch, screens and guests sorted from the same booking.',
		video: '/videos/hero.mp4',
		poster: '/videos/hero-poster.jpg',
		caption: 'Dock House, level 4 · the open floor at 09:40',
	},

	/** Quick query bar on the homepage */
	query: {
		heading: 'What do you need today?',
		submit: 'Find a space',
	},

	freeNow: {
		heading: 'Free right now',
		lead: 'Live from every house. Seats on the open floor, and rooms you could walk into in the next hour.',
	},

	housesSection: {
		heading: 'Six houses, one booking.',
		lead: 'Every house has the same Wi-Fi, the same coffee and the same booking. Pick the one near you today and a different one tomorrow.',
	},

	kindsSection: {
		heading: 'Seven ways to use a house.',
		lead: 'From one seat for a morning to a roof terrace for sixty. Everything books the same way, by the half hour or the day.',
	},

	daySection: {
		heading: 'Plan the whole day at once.',
		lead: 'A desk from nine, a room at eleven for your call with the client, lunch for six at half twelve and a booth at three. One day sheet, one payment.',
		steps: [
			{ time: '09:00', title: 'Flex desk', note: 'Half day on the open floor', kind: 'flex' as KindKey, span: 4 },
			{ time: '11:00', title: 'Hanover, 8 seats', note: 'Video bar + coffee for 6', kind: 'room' as KindKey, span: 1 },
			{ time: '12:30', title: 'Working lunch', note: 'Delivered to Hanover', kind: 'room' as KindKey, span: 0.5 },
			{ time: '15:00', title: 'Phone booth B2', note: '30 minutes', kind: 'booth' as KindKey, span: 0.5 },
		],
	},

	extrasSection: {
		heading: 'Add the things that make it work.',
		lead: 'Coffee for the room, a 360° camera, parking, a guest at the desk next to you. Every extra is priced up front and lands on the same booking.',
	},

	pricingSection: {
		heading: 'What a day costs.',
		lead: 'No membership, no deposit, no setup fee. You pay for the hours you book, and the price you see includes VAT.',
	},

	teams: {
		heading: 'Gable for teams.',
		lead: 'One company account, everyone books under it, one invoice at the end of the month. Good for distributed teams who meet up twice a week, and for offsites.',
		points: [
			{ title: 'One invoice', body: 'Every booking by your team on one monthly invoice, with the company details on it.' },
			{ title: 'Team days', body: 'Book a block of flex seats and a room for the same day, so everyone lands together.' },
			{ title: 'Offsites', body: 'The Roof Terrace or the Long Room with food, a host and kit, planned with you.' },
			{ title: 'Any house', body: 'Your Cork people use Shandon, your Dublin people use Dock House, on the same account.' },
		],
		formHeading: 'Tell us about your team',
		formLead: 'We reply within one working day with a proposal and a person to talk to.',
	},

	testimonials: [
		{ quote: 'I book a studio desk at Smithfield every Tuesday and Thursday. Same desk, same monitor, my notebook still in the locker. It’s the closest thing to an office I want.', name: 'Aoife Brennan', role: 'Product designer, freelance' },
		{ quote: 'Twelve of us fly in from three countries once a quarter. Dock House gives us the terrace, two rooms and lunch, all on one booking and one invoice.', name: 'Tomás Ó Ceallaigh', role: 'Head of Engineering, Fernhill' },
		{ quote: 'We record two episodes a week in the Sound Room. Their engineer has rescued more than one take. Booking it takes about a minute.', name: 'Niamh & Dev', role: 'Hosts, The Long Lunch podcast' },
		{ quote: 'A swim at the Forty Foot, a shower at Harbour, a desk facing the sea by nine. I’ve stopped pretending I miss the office.', name: 'Conor Walsh', role: 'Solicitor, remote' },
	],

	faq: [
		{ q: 'Do I need a membership?', a: 'No. Book what you need when you need it and pay for that booking. Teams who book a lot can get one monthly invoice through a company account.' },
		{ q: 'What’s the difference between a flex desk and a studio desk?', a: 'A flex desk is any free seat on the open floor. A studio desk is a named desk in the quiet studio with a 27" monitor, a task chair and a locker, and you can book the same one each time.' },
		{ q: 'Can I book a meeting room for just 30 minutes?', a: 'Yes. Rooms and booths book in 30-minute steps, up to eight hours for a room and two for a booth.' },
		{ q: 'How do my guests get in?', a: 'Add their emails when you book (or later from your account). They get the details and we have their names at reception.' },
		{ q: 'Can I change or cancel a booking?', a: 'Yes, from your account. Move the time or cancel up to the cut-off shown on the booking; after that, talk to the house team.' },
		{ q: 'Is VAT included?', a: 'Yes. Every price on the site includes Irish VAT. Add your company name at checkout and it goes on the receipt.' },
		{ q: 'Can I bring a dog?', a: 'Well-behaved dogs are welcome at Portobello, Smithfield and Spanish Arch. Not in meeting rooms, please.' },
		{ q: 'Are the houses accessible?', a: 'Dock House, Smithfield and Harbour have step-free access and lifts. Portobello and Spanish Arch have steps at the door; call the house and we’ll help.' },
	],

	about: {
		heading: 'We restore old buildings and fill them with people working.',
		lead: 'Gable started in 2017 in one floor of a grain warehouse at Grand Canal Dock. Today there are six houses, and each one was something else first: a bonded whiskey store, a Georgian townhouse, a butter market.',
		body: [
			'We keep what made the building good: the granite, the brick vaults, the sash windows, the light. Then we add what makes a working day good: a proper chair, a door that closes for a call, coffee someone cares about, rooms that work with one cable.',
			'Nobody has to sign up for anything. You book a seat or a room for the time you need it, and the house is yours for the day: the kitchen, the terrace, the booths, the people.',
		],
		principles: [
			{ title: 'Keep the building', body: 'We restore, not refit. Every house keeps its original walls, floors and windows.' },
			{ title: 'Book what you use', body: 'By the half hour or the day. No memberships, no lock-in, prices with VAT.' },
			{ title: 'A house team', body: 'Real people at every reception who know your name and your coffee.' },
			{ title: 'Local food', body: 'Catering from independent kitchens in each city, delivered to the room.' },
		],
		figures: [
			{ value: '6', label: 'houses' },
			{ value: '3', label: 'cities' },
			{ value: '1820', label: 'oldest building' },
			{ value: '0', label: 'memberships' },
		],
	},

	footer: {
		note: 'Drawn in Dublin. All prices include VAT.',
	},
};

export type SiteConfig = typeof siteConfig;
