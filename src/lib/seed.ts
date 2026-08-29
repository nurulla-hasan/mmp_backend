import bcrypt from "bcryptjs";
import { env } from "../config/index";
import { prisma } from "./prisma";

const ADMIN_EMAIL = env.ADMIN_EMAIL ?? "admin@mouzamappro.com";
const ADMIN_NAME = env.ADMIN_NAME ?? "System Admin";
const ADMIN_PASSWORD = env.ADMIN_PASSWORD ?? "11111111";

const SURVEYOR_EMAIL = env.SURVEYOR_EMAIL ?? "surveyor@mouzamappro.com";
const SURVEYOR_NAME = env.SURVEYOR_NAME ?? "Demo Surveyor";
const SURVEYOR_PASSWORD = env.SURVEYOR_PASSWORD ?? "11111111";

export const seedAdmin = async (): Promise<void> => {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: "ADMIN",
      emailVerified: true,
      status: "ACTIVE",
    },
  });

  console.log(`Admin seeded successfully: ${ADMIN_EMAIL}`);
};

export const SEED_SERVICES = [
  {
    slug: "land-measurement",
    name: "জমি পরিমাপ",
    description: "প্লটের সঠিক মাপ ও ক্ষেত্রফল নির্ধারণ করুন।",
  },
  {
    slug: "land-division",
    name: "জমি ভাগ-বাটোয়ারা",
    description: "ভাগ জমির সঠিক বণ্টন ও আলাদা প্লট গণনা করুন।",
  },
  {
    slug: "boundary-demarcation",
    name: "সীমানা নির্ধারণ",
    description: "জমির সঠিক সীমানা ও সীমানা পিলার চিহ্নিত করুন।",
  },
  {
    slug: "digital-survey",
    name: "ডিজিটাল সার্ভে",
    description: "আধুনিক ডিজিটাল পদ্ধতিতে জরিপ সম্পন্ন করুন।",
  },
  {
    slug: "mouza-map-support",
    name: "মৌজা ম্যাপ সহায়তা",
    description: "মৌজা ম্যাপ বুঝতে ও তথ্য সংগ্রহে সাহায্য নিন।",
  },
  {
    slug: "survey-report",
    name: "পরিমাপ রিপোর্ট প্রস্তুতি",
    description: "জরিপকৃত জমির পূর্ণাঙ্গ রিপোর্ট তৈরি করুন।",
  },
  {
    slug: "khatian-verification",
    name: "খতিয়ান ও দাগ যাচাই",
    description: "খতিয়ান ও দাগ নম্বর অনুযায়ী জমির মালিকানা ও অবস্থান যাচাই করুন।",
  },
  {
    slug: "building-layout",
    name: "বিল্ডিং লেআউট",
    description: "বাড়ি ও স্থাপনা নির্মাণের জন্য সঠিক পজিশনিং ও লেআউট প্রদান।",
  },
];

export const SEED_DISTRICTS = [
  // ── ঢাকা বিভাগ ──────────────────────────────────────────────────────────
  {
    name: "ঢাকা",
    slug: "dhaka",
    upazilas: [
      { name: "ঢাকা সদর", slug: "dhaka-sadar" },
      { name: "ধানমন্ডি", slug: "dhanmondi" },
      { name: "গুলশান", slug: "gulshan" },
      { name: "মিরপুর", slug: "mirpur" },
      { name: "উত্তরা", slug: "uttara" },
      { name: "তেজগাঁও", slug: "tejgaon" },
      { name: "সাভার", slug: "savar" },
      { name: "ধামরাই", slug: "dhamrai" },
      { name: "কেরানীগঞ্জ", slug: "keraniganj" },
      { name: "দোহার", slug: "dohar" },
      { name: "নবাবগঞ্জ", slug: "nawabganj" },
    ],
  },
  {
    name: "গাজীপুর",
    slug: "gazipur",
    upazilas: [
      { name: "গাজীপুর সদর", slug: "gazipur-sadar" },
      { name: "টঙ্গী", slug: "tongi" },
      { name: "কালিয়াকৈর", slug: "kaliakair" },
      { name: "শ্রীপুর", slug: "sreepur" },
      { name: "কাপাসিয়া", slug: "kapasia" },
      { name: "কালীগঞ্জ", slug: "kaliganj" },
    ],
  },
  {
    name: "নারায়ণগঞ্জ",
    slug: "narayanganj",
    upazilas: [
      { name: "নারায়ণগঞ্জ সদর", slug: "narayanganj-sadar" },
      { name: "রূপগঞ্জ", slug: "rupganj" },
      { name: "সোনারগাঁও", slug: "sonargaon" },
      { name: "বন্দর", slug: "bandar" },
      { name: "আড়াইহাজার", slug: "araihazar" },
    ],
  },
  {
    name: "নরসিংদী",
    slug: "narsingdi",
    upazilas: [
      { name: "নরসিংদী সদর", slug: "narsingdi-sadar" },
      { name: "পলাশ", slug: "palash" },
      { name: "শিবপুর", slug: "shibpur" },
      { name: "রায়পুরা", slug: "raipura" },
      { name: "বেলাবো", slug: "belabo" },
      { name: "মনোহরদী", slug: "monohardi" },
    ],
  },
  {
    name: "টাঙ্গাইল",
    slug: "tangail",
    upazilas: [
      { name: "টাঙ্গাইল সদর", slug: "tangail-sadar" },
      { name: "মির্জাপুর", slug: "mirzapur" },
      { name: "সখিপুর", slug: "sakhipur" },
      { name: "ঘাটাইল", slug: "ghatail" },
      { name: "মধুপুর", slug: "madhupur" },
      { name: "কালিহাতী", slug: "kalihati" },
      { name: "গোপালপুর", slug: "gopalpur" },
      { name: "বাসাইল", slug: "basail" },
      { name: "দেলদুয়ার", slug: "delduar" },
      { name: "নাগরপুর", slug: "nagarpur" },
      { name: "ভূঞাপুর", slug: "bhuapur" },
      { name: "ধনবাড়ী", slug: "dhanbari" },
    ],
  },
  {
    name: "কিশোরগঞ্জ",
    slug: "kishoreganj",
    upazilas: [
      { name: "কিশোরগঞ্জ সদর", slug: "kishoreganj-sadar" },
      { name: "ভৈরব", slug: "bhairab" },
      { name: "বাজিতপুর", slug: "bajitpur" },
      { name: "কটিয়াদী", slug: "katiadi" },
      { name: "পাকুন্দিয়া", slug: "pakundia" },
      { name: "করিমগঞ্জ", slug: "karimganj" },
      { name: "তাড়াইল", slug: "tarail" },
      { name: "হোসেনপুর", slug: "hossainpur" },
      { name: "নিকলী", slug: "nikli" },
      { name: "অষ্টগ্রাম", slug: "austagram" },
      { name: "মিঠামইন", slug: "mithamain" },
      { name: "ইটনা", slug: "itna" },
      { name: "কুলিয়ারচর", slug: "kuliarchar" },
    ],
  },
  {
    name: "মানিকগঞ্জ",
    slug: "manikganj",
    upazilas: [
      { name: "মানিকগঞ্জ সদর", slug: "manikganj-sadar" },
      { name: "সাটুরিয়া", slug: "saturia" },
      { name: "সিংগাইর", slug: "singair" },
      { name: "শিবালয়", slug: "shibalaya" },
      { name: "হরিরামপুর", slug: "harirampur" },
      { name: "দৌলতপুর", slug: "daulatpur" },
      { name: "ঘিওর", slug: "ghior" },
    ],
  },
  {
    name: "মুন্সীগঞ্জ",
    slug: "munshiganj",
    upazilas: [
      { name: "মুন্সীগঞ্জ সদর", slug: "munshiganj-sadar" },
      { name: "শ্রীনগর", slug: "sreenagar" },
      { name: "সিরাজদিখান", slug: "sirajdikhan" },
      { name: "লৌহজং", slug: "louhajang" },
      { name: "টঙ্গীবাড়ি", slug: "tongibari" },
      { name: "গজারিয়া", slug: "gazaria" },
    ],
  },
  {
    name: "ফরিদপুর",
    slug: "faridpur",
    upazilas: [
      { name: "ফরিদপুর সদর", slug: "faridpur-sadar" },
      { name: "বোয়ালমারী", slug: "boalmari" },
      { name: "ভাঙ্গা", slug: "bhanga" },
      { name: "আলফাডাঙ্গা", slug: "alfadanga" },
      { name: "নগরকান্দা", slug: "nagarkanda" },
      { name: "মধুখালী", slug: "madhukhali" },
      { name: "সদরপুর", slug: "sadarpur" },
      { name: "চরভদ্রাসন", slug: "charbhadrasan" },
      { name: "সালথা", slug: "saltha" },
    ],
  },
  {
    name: "গোপালগঞ্জ",
    slug: "gopalganj",
    upazilas: [
      { name: "গোপালগঞ্জ সদর", slug: "gopalganj-sadar" },
      { name: "টুঙ্গিপাড়া", slug: "tungipara" },
      { name: "কোটালীপাড়া", slug: "kotalipara" },
      { name: "কাশিয়ানী", slug: "kashiani" },
      { name: "মুকসুদপুর", slug: "muksudpur" },
    ],
  },
  {
    name: "মাদারীপুর",
    slug: "madaripur",
    upazilas: [
      { name: "মাদারীপুর সদর", slug: "madaripur-sadar" },
      { name: "শিবচর", slug: "shibchar" },
      { name: "কালকিনি", slug: "kalkini" },
      { name: "রাজৈর", slug: "rajoir" },
      { name: "ডাসার", slug: "dasar" },
    ],
  },
  {
    name: "রাজবাড়ী",
    slug: "rajbari",
    upazilas: [
      { name: "রাজবাড়ী সদর", slug: "rajbari-sadar" },
      { name: "পাংশা", slug: "pangsha" },
      { name: "বালিয়াকান্দি", slug: "baliakandi" },
      { name: "গোয়ালন্দ", slug: "goalanda" },
      { name: "কালুখালী", slug: "kalukhali" },
    ],
  },
  {
    name: "শরীয়তপুর",
    slug: "shariatpur",
    upazilas: [
      { name: "শরীয়তপুর সদর", slug: "shariatpur-sadar" },
      { name: "জাজিরা", slug: "zajira" },
      { name: "নড়িয়া", slug: "naria" },
      { name: "ভেদরগঞ্জ", slug: "bhedarganj" },
      { name: "ডামুড্যা", slug: "damudya" },
      { name: "গোসাইরহাট", slug: "gosairhat" },
    ],
  },

  // ── চট্টগ্রাম বিভাগ ───────────────────────────────────────────────────────
  {
    name: "চট্টগ্রাম",
    slug: "chattogram",
    upazilas: [
      { name: "কোতোয়ালী", slug: "kotwali" },
      { name: "পাঁচলাইশ", slug: "panchlaish" },
      { name: "ডবলমুরিং", slug: "double-mooring" },
      { name: "পতেঙ্গা", slug: "patenga" },
      { name: "পাহাড়তলী", slug: "pahartali" },
      { name: "সীতাকুণ্ড", slug: "sitakunda" },
      { name: "মীরসরাই", slug: "mirsharai" },
      { name: "হাটহাজারী", slug: "hathazari" },
      { name: "পটিয়া", slug: "patia" },
      { name: "আনোয়ারা", slug: "anwara" },
      { name: "রাউজান", slug: "raozan" },
      { name: "ফটিকছড়ি", slug: "fatikchhari" },
      { name: "বোয়ালখালী", slug: "boalkhali" },
      { name: "চন্দনাইশ", slug: "chandanaish" },
      { name: "বাঁশখালী", slug: "banskhali" },
      { name: "সাতকানিয়া", slug: "satkania" },
      { name: "লোহাগাড়া", slug: "lohagara" },
      { name: "সন্দ্বীপ", slug: "sandwip" },
      { name: "কর্ণফুলী", slug: "karnaphuli" },
    ],
  },
  {
    name: "কুমিল্লা",
    slug: "cumilla",
    upazilas: [
      { name: "কুমিল্লা আদর্শ সদর", slug: "cumilla-adarsha-sadar" },
      { name: "কুমিল্লা সদর দক্ষিণ", slug: "cumilla-sadar-south" },
      { name: "দাউদকান্দি", slug: "daudkandi" },
      { name: "চান্দিনা", slug: "chandina" },
      { name: "লাকসাম", slug: "laksam" },
      { name: "চৌদ্দগ্রাম", slug: "chauddagram" },
      { name: "দেবিদ্বার", slug: "debidwar" },
      { name: "মুরাদনগর", slug: "muradnagar" },
      { name: "বুড়িচং", slug: "burichang" },
      { name: "ব্রাহ্মণপাড়া", slug: "brahmanpara" },
      { name: "বরুড়া", slug: "barura" },
      { name: "হোমনা", slug: "homna" },
      { name: "মেঘনা", slug: "meghna" },
      { name: "তিতাস", slug: "titas" },
      { name: "মনোহরগঞ্জ", slug: "monohargonj" },
      { name: "নাঙ্গলকোট", slug: "nangalkot" },
      { name: "লালমাই", slug: "lalmai" },
    ],
  },
  {
    name: "কক্সবাজার",
    slug: "coxs-bazar",
    upazilas: [
      { name: "কক্সবাজার সদর", slug: "coxs-bazar-sadar" },
      { name: "রামু", slug: "ramu" },
      { name: "টেকনাফ", slug: "teknaf" },
      { name: "উখিয়া", slug: "ukhiya" },
      { name: "চকরিয়া", slug: "chakaria" },
      { name: "পেকুয়া", slug: "pekua" },
      { name: "মহেশখালী", slug: "moheshkhali" },
      { name: "কুতুবদিয়া", slug: "kutubdia" },
      { name: "ঈদগাঁও", slug: "eidgaon" },
    ],
  },
  {
    name: "ব্রাহ্মণবাড়িয়া",
    slug: "brahmanbaria",
    upazilas: [
      { name: "ব্রাহ্মণবাড়িয়া সদর", slug: "brahmanbaria-sadar" },
      { name: "আশুগঞ্জ", slug: "ashuganj" },
      { name: "সরাইল", slug: "sarail" },
      { name: "কসবা", slug: "kasba" },
      { name: "নবীনগর", slug: "nabinagar" },
      { name: "আখাউড়া", slug: "akhaura" },
      { name: "বাঞ্ছারামপুর", slug: "bancharampur" },
      { name: "নাসিরনগর", slug: "nasirnagar" },
      { name: "বিজয়নগর", slug: "bijoynagar" },
    ],
  },
  {
    name: "নোয়াখালী",
    slug: "noakhali",
    upazilas: [
      { name: "নোয়াখালী সদর", slug: "noakhali-sadar" },
      { name: "বেগমগঞ্জ", slug: "begumganj" },
      { name: "কোম্পানীগঞ্জ", slug: "companiganj" },
      { name: "চাটখিল", slug: "chatkhil" },
      { name: "সেনবাগ", slug: "senbagh" },
      { name: "হাতিয়া", slug: "hatiya" },
      { name: "সোনাইমুড়ী", slug: "sonaimuri" },
      { name: "সুবর্ণচর", slug: "subarnachar" },
      { name: "কবিরহাট", slug: "kabirhat" },
    ],
  },
  {
    name: "ফেনী",
    slug: "feni",
    upazilas: [
      { name: "ফেনী সদর", slug: "feni-sadar" },
      { name: "দাগনভূঞা", slug: "daganbhuiyan" },
      { name: "সোনাগাজী", slug: "sonagazi" },
      { name: "ছাগলনাইয়া", slug: "chhagalnaiya" },
      { name: "পরশুরাম", slug: "parshuram" },
      { name: "ফুলগাজী", slug: "fulgazi" },
    ],
  },
  {
    name: "চাঁদপুর",
    slug: "chandpur",
    upazilas: [
      { name: "চাঁদপুর সদর", slug: "chandpur-sadar" },
      { name: "ফরিদগঞ্জ", slug: "faridganj" },
      { name: "হাজীগঞ্জ", slug: "hajiganj" },
      { name: "শাহরাস্তি", slug: "shahrasti" },
      { name: "কচুয়া", slug: "kachua" },
      { name: "মতলব উত্তর", slug: "matlab-north" },
      { name: "মতলব দক্ষিণ", slug: "matlab-south" },
      { name: "হাইমচর", slug: "haimchar" },
    ],
  },
  {
    name: "লক্ষ্মীপুর",
    slug: "lakshmipur",
    upazilas: [
      { name: "লক্ষ্মীপুর সদর", slug: "lakshmipur-sadar" },
      { name: "রায়পুর", slug: "raipur" },
      { name: "রামগঞ্জ", slug: "ramganj" },
      { name: "রামগতি", slug: "ramgati" },
      { name: "কমলনগর", slug: "kamalnagar" },
    ],
  },
  {
    name: "রাঙ্গামাটি",
    slug: "rangamati",
    upazilas: [
      { name: "রাঙ্গামাটি সদর", slug: "rangamati-sadar" },
      { name: "কাপ্তাই", slug: "kaptai" },
      { name: "বাঘাইছড়ি", slug: "baghaichhari" },
      { name: "কাউখালী", slug: "kawkhali" },
    ],
  },
  {
    name: "বান্দরবান",
    slug: "bandarban",
    upazilas: [
      { name: "বান্দরবান সদর", slug: "bandarban-sadar" },
      { name: "লামা", slug: "lama" },
      { name: "রুমা", slug: "ruma" },
      { name: "থানচি", slug: "thanchi" },
    ],
  },
  {
    name: "খাগড়াছড়ি",
    slug: "khagrachhari",
    upazilas: [
      { name: "খাগড়াছড়ি সদর", slug: "khagrachhari-sadar" },
      { name: "দীঘিনালা", slug: "dighinala" },
      { name: "রামগড়", slug: "ramgarh" },
      { name: "পানছড়ি", slug: "panchhari" },
    ],
  },

  // ── রাজশাহী বিভাগ ────────────────────────────────────────────────────────
  {
    name: "রাজশাহী",
    slug: "rajshahi",
    upazilas: [
      { name: "বোয়ালিয়া", slug: "boalia" },
      { name: "মতিহার", slug: "motihar" },
      { name: "রাজপাড়া", slug: "rajpara" },
      { name: "শাহমখদুম", slug: "shah-makhdum" },
      { name: "পবা", slug: "paba" },
      { name: "গোদাগাড়ী", slug: "godagari" },
      { name: "তানোর", slug: "tanore" },
      { name: "বাগমারা", slug: "bagmara" },
      { name: "চারঘাট", slug: "charghat" },
      { name: "পুঠিয়া", slug: "puthia" },
      { name: "দুর্গাপুর", slug: "durgapur" },
      { name: "বাঘা", slug: "bagha" },
      { name: "মোহনপুর", slug: "mohanpur" },
    ],
  },
  {
    name: "বগুড়া",
    slug: "bogura",
    upazilas: [
      { name: "বগুড়া সদর", slug: "bogura-sadar" },
      { name: "শেরপুর", slug: "sherpur" },
      { name: "শিবগঞ্জ", slug: "shibganj" },
      { name: "সারিয়াকান্দি", slug: "sariakandi" },
      { name: "সোনাতলা", slug: "sonatala" },
      { name: "ধুনট", slug: "dhunat" },
      { name: "আদমদীঘি", slug: "adamdighi" },
      { name: "দুপচাঁচিয়া", slug: "dupchanchia" },
      { name: "নন্দীগ্রাম", slug: "nandigram" },
      { name: "গাবতলী", slug: "gabtali" },
      { name: "কাহালু", slug: "kahaloo" },
      { name: "শাহজাহানপুর", slug: "shajahanpur" },
    ],
  },
  {
    name: "পাবনা",
    slug: "pabna",
    upazilas: [
      { name: "পাবনা সদর", slug: "pabna-sadar" },
      { name: "ঈশ্বরদী", slug: "ishwardi" },
      { name: "সুজানগর", slug: "sujanagar" },
      { name: "সাঁথিয়া", slug: "santhia" },
      { name: "চাটমোহর", slug: "chatmohar" },
      { name: "ফরিদপুর", slug: "faridpur-pabna" },
      { name: "বেড়া", slug: "bera" },
      { name: "আটঘরিয়া", slug: "atgharia" },
      { name: "ভাঙ্গুড়া", slug: "bhangura" },
    ],
  },
  {
    name: "সিরাজগঞ্জ",
    slug: "sirajganj",
    upazilas: [
      { name: "সিরাজগঞ্জ সদর", slug: "sirajganj-sadar" },
      { name: "শাহজাদপুর", slug: "shahjadpur" },
      { name: "উল্লাপাড়া", slug: "ullapara" },
      { name: "রায়গঞ্জ", slug: "raiganj" },
      { name: "বেলকুচি", slug: "belkuchi" },
      { name: "কাজীপুর", slug: "kazipur" },
      { name: "কামারখন্দ", slug: "kamarkhanda" },
      { name: "তাড়াশ", slug: "tarash" },
      { name: "চৌহালী", slug: "chauhali" },
    ],
  },
  {
    name: "নওগাঁ",
    slug: "naogaon",
    upazilas: [
      { name: "নওগাঁ সদর", slug: "naogaon-sadar" },
      { name: "মহাদেবপুর", slug: "mohadevpur" },
      { name: "মান্দা", slug: "manda" },
      { name: "পত্নীতলা", slug: "patnitala" },
      { name: "ধামইরহাট", slug: "dhamoirhat" },
      { name: "বদলগাছী", slug: "badalgachhi" },
      { name: "আত্রাই", slug: "atrai" },
      { name: "রানীনগর", slug: "raninagar" },
      { name: "নিয়ামতপুর", slug: "niamatpur" },
      { name: "পোরশা", slug: "porsha" },
      { name: "সপাহার", slug: "sapahar" },
    ],
  },
  {
    name: "নাটোর",
    slug: "natore",
    upazilas: [
      { name: "নাটোর সদর", slug: "natore-sadar" },
      { name: "সিংড়া", slug: "singra" },
      { name: "বড়াইগ্রাম", slug: "baraigram" },
      { name: "গুরুদাসপুর", slug: "gurudaspur" },
      { name: "লালপুর", slug: "lalpur" },
      { name: "বাগাতিপাড়া", slug: "bagatipara" },
      { name: "নলডাঙ্গা", slug: "naldanga" },
    ],
  },
  {
    name: "চাঁপাইনবাবগঞ্জ",
    slug: "chapainawabganj",
    upazilas: [
      { name: "চাঁপাইনবাবগঞ্জ সদর", slug: "chapainawabganj-sadar" },
      { name: "শিবগঞ্জ", slug: "shibganj-chapai" },
      { name: "গোমস্তাপুর", slug: "gomastapur" },
      { name: "নাচোল", slug: "nachole" },
      { name: "ভোলাহাট", slug: "bholahat" },
    ],
  },
  {
    name: "জয়পুরহাট",
    slug: "joypurhat",
    upazilas: [
      { name: "জয়পুরহাট সদর", slug: "joypurhat-sadar" },
      { name: "পাঁচবিবি", slug: "panchbibi" },
      { name: "কালাই", slug: "kalai" },
      { name: "ক্ষেতলাল", slug: "khetlal" },
      { name: "আক্কেলপুর", slug: "akkelpur" },
    ],
  },

  // ── রংপুর বিভাগ ──────────────────────────────────────────────────────────
  {
    name: "রংপুর",
    slug: "rangpur",
    upazilas: [
      { name: "রংপুর সদর", slug: "rangpur-sadar" },
      { name: "পীরগঞ্জ", slug: "pirganj" },
      { name: "বদরগঞ্জ", slug: "badarganj" },
      { name: "গংগাচড়া", slug: "gangachhara" },
      { name: "মিঠাপুকুর", slug: "mithapukur" },
      { name: "কাউনিয়া", slug: "kaunia" },
      { name: "পীরগাছা", slug: "pirgacha" },
      { name: "তারাগঞ্জ", slug: "taraganj" },
    ],
  },
  {
    name: "দিনাজপুর",
    slug: "dinajpur",
    upazilas: [
      { name: "দিনাজপুর সদর", slug: "dinajpur-sadar" },
      { name: "বিরল", slug: "birol" },
      { name: "কাহারোল", slug: "kaharole" },
      { name: "বোচাগঞ্জ", slug: "bochaganj" },
      { name: "বীরগঞ্জ", slug: "birganj" },
      { name: "ফুলবাড়ী", slug: "fulbari" },
      { name: "বিরামপুর", slug: "birampur" },
      { name: "পার্বতীপুর", slug: "parbatipur" },
      { name: "নবাবগঞ্জ", slug: "nawabganj-dinajpur" },
      { name: "ঘোড়াঘাট", slug: "ghoraghat" },
      { name: "হাকিমপুর", slug: "hakimpur" },
      { name: "চিরিরবন্দর", slug: "chirirbandar" },
      { name: "খানসামা", slug: "khansama" },
    ],
  },
  {
    name: "কুড়িগ্রাম",
    slug: "kurigram",
    upazilas: [
      { name: "কুড়িগ্রাম সদর", slug: "kurigram-sadar" },
      { name: "উলিপুর", slug: "ulipur" },
      { name: "নাগেশ্বরী", slug: "nageshwari" },
      { name: "ভুরুঙ্গামারী", slug: "bhurungamari" },
      { name: "চিলমারী", slug: "chilmari" },
      { name: "রাজারহাট", slug: "rajarhat" },
      { name: "রৌমারী", slug: "roumari" },
      { name: "রাজিবপুর", slug: "rajibpur" },
      { name: "ফুলবাড়ী", slug: "fulbari-kurigram" },
    ],
  },
  {
    name: "নীলফামারী",
    slug: "nilphamari",
    upazilas: [
      { name: "নীলফামারী সদর", slug: "nilphamari-sadar" },
      { name: "সৈয়দপুর", slug: "saidpur" },
      { name: "ডোমার", slug: "domar" },
      { name: "ডিমলা", slug: "dimla" },
      { name: "জলঢাকা", slug: "jaldhaka" },
      { name: "কিশোরগঞ্জ", slug: "kishoreganj-nilphamari" },
    ],
  },
  {
    name: "গাইবান্ধা",
    slug: "gaibandha",
    upazilas: [
      { name: "গাইবান্ধা সদর", slug: "gaibandha-sadar" },
      { name: "গোবিন্দগঞ্জ", slug: "gobindaganj" },
      { name: "পলাশবাড়ী", slug: "palashbari" },
      { name: "সুন্দরগঞ্জ", slug: "sundarganj" },
      { name: "সাদুল্লাপুর", slug: "sadullapur" },
      { name: "সাঘাটা", slug: "saghata" },
      { name: "ফুলছড়ি", slug: "fulchhari" },
    ],
  },
  {
    name: "লালমনিরহাট",
    slug: "lalmonirhat",
    upazilas: [
      { name: "লালমনিরহাট সদর", slug: "lalmonirhat-sadar" },
      { name: "পাটগ্রাম", slug: "patgram" },
      { name: "হাতীবান্ধা", slug: "hatibandha" },
      { name: "কালীগঞ্জ", slug: "kaliganj-lalmonirhat" },
      { name: "আদিতমারী", slug: "aditmari" },
    ],
  },
  {
    name: "ঠাকুরগাঁও",
    slug: "thakurgaon",
    upazilas: [
      { name: "ঠাকুরগাঁও সদর", slug: "thakurgaon-sadar" },
      { name: "পীরগঞ্জ", slug: "pirganj-thakurgaon" },
      { name: "রানীশংকৈল", slug: "ranisankail" },
      { name: "বালিয়াডাঙ্গী", slug: "baliadangi" },
      { name: "হরিপুর", slug: "haripur" },
    ],
  },
  {
    name: "পঞ্চগড়",
    slug: "panchagarh",
    upazilas: [
      { name: "পঞ্চগড় সদর", slug: "panchagarh-sadar" },
      { name: "তেঁতুলিয়া", slug: "tetulia" },
      { name: "বোদা", slug: "boda" },
      { name: "দেবীগঞ্জ", slug: "debiganj" },
      { name: "আটোয়ারী", slug: "atwari" },
    ],
  },

  // ── খুলনা বিভাগ ──────────────────────────────────────────────────────────
  {
    name: "খুলনা",
    slug: "khulna",
    upazilas: [
      { name: "খুলনা সদর", slug: "khulna-sadar" },
      { name: "সোনাডাঙ্গা", slug: "sonadanga" },
      { name: "খালিশপুর", slug: "khalishpur" },
      { name: "দৌলতপুর", slug: "daulatpur-khulna" },
      { name: "রূপসা", slug: "rupsha" },
      { name: "ফুলতলা", slug: "phultala" },
      { name: "ডুমুরিয়া", slug: "dumuria" },
      { name: "বটিয়াঘাটা", slug: "batiaghata" },
      { name: "দাকোপ", slug: "dacope" },
      { name: "পাইকগাছা", slug: "paikgachha" },
      { name: "কয়রা", slug: "koyra" },
      { name: "তেরখাদা", slug: "terokhada" },
      { name: "দিঘলিয়া", slug: "dighalia" },
    ],
  },
  {
    name: "যশোর",
    slug: "jashore",
    upazilas: [
      { name: "যশোর সদর", slug: "jashore-sadar" },
      { name: "ঝিকরগাছা", slug: "jhikargachha" },
      { name: "শার্শা", slug: "sharsha" },
      { name: "মণিরামপুর", slug: "manirampur" },
      { name: "কেশবপুর", slug: "keshabpur" },
      { name: "বাঘারপাড়া", slug: "bagherpara" },
      { name: "অভয়নগর", slug: "abhaynagar" },
      { name: "চৌগাছা", slug: "chaugachha" },
    ],
  },
  {
    name: "কুষ্টিয়া",
    slug: "kushtia",
    upazilas: [
      { name: "কুষ্টিয়া সদর", slug: "kushtia-sadar" },
      { name: "কুমারখালী", slug: "kumarkhali" },
      { name: "ভেড়ামারা", slug: "bheramara" },
      { name: "মিরপুর", slug: "mirpur-kushtia" },
      { name: "খোকসা", slug: "khoksa" },
      { name: "দৌলতপুর", slug: "daulatpur-kushtia" },
    ],
  },
  {
    name: "সাতক্ষীরা",
    slug: "satkhira",
    upazilas: [
      { name: "সাতক্ষীরা সদর", slug: "satkhira-sadar" },
      { name: "কলারোয়া", slug: "kalaroa" },
      { name: "তালা", slug: "tala" },
      { name: "দেবহাটা", slug: "debhata" },
      { name: "কালীগঞ্জ", slug: "kaliganj-satkhira" },
      { name: "শ্যামনগর", slug: "shyamnagar" },
      { name: "আশাশুনি", slug: "assasuni" },
    ],
  },
  {
    name: "বাগেরহাট",
    slug: "bagerhat",
    upazilas: [
      { name: "বাগেরহাট সদর", slug: "bagerhat-sadar" },
      { name: "মোংলা", slug: "mongla" },
      { name: "মোরেলগঞ্জ", slug: "morelganj" },
      { name: "রামপাল", slug: "rampal" },
      { name: "ফকিরহাট", slug: "fakirhat" },
      { name: "কচুয়া", slug: "kachua-bagerhat" },
      { name: "শরণখোলা", slug: "sarankhola" },
      { name: "মোল্লাহাট", slug: "mollahat" },
      { name: "চিতলমারী", slug: "chitalmari" },
    ],
  },
  {
    name: "ঝিনাইদহ",
    slug: "jhenaidah",
    upazilas: [
      { name: "ঝিনাইদহ সদর", slug: "jhenaidah-sadar" },
      { name: "শৈলকুপা", slug: "shailkupa" },
      { name: "হরিণাকুণ্ডু", slug: "harinakundu" },
      { name: "কালীগঞ্জ", slug: "kaliganj-jhenaidah" },
      { name: "কোটচাঁদপুর", slug: "kotchandpur" },
      { name: "মহেশপুর", slug: "maheshpur" },
    ],
  },
  {
    name: "চুয়াডাঙ্গা",
    slug: "chuadanga",
    upazilas: [
      { name: "চুয়াডাঙ্গা সদর", slug: "chuadanga-sadar" },
      { name: "আলমডাঙ্গা", slug: "alamdanga" },
      { name: "দামুড়হুদা", slug: "damurhuda" },
      { name: "জীবননগর", slug: "jibannagar" },
    ],
  },
  {
    name: "মেহেরপুর",
    slug: "meherpur",
    upazilas: [
      { name: "মেহেরপুর সদর", slug: "meherpur-sadar" },
      { name: "গাংনী", slug: "gangni" },
      { name: "মুজিবনগর", slug: "mujibnagar" },
    ],
  },
  {
    name: "মাগুরা",
    slug: "magura",
    upazilas: [
      { name: "মাগুরা সদর", slug: "magura-sadar" },
      { name: "শ্রীপুর", slug: "sreepur-magura" },
      { name: "শালিখা", slug: "shalikha" },
      { name: "মহম্মদপুর", slug: "mohammadpur" },
    ],
  },
  {
    name: "নড়াইল",
    slug: "narail",
    upazilas: [
      { name: "নড়াইল সদর", slug: "narail-sadar" },
      { name: "লোহাগড়া", slug: "lohagara-narail" },
      { name: "কালিয়া", slug: "kalia" },
    ],
  },

  // ── সিলেট বিভাগ ──────────────────────────────────────────────────────────
  {
    name: "সিলেট",
    slug: "sylhet",
    upazilas: [
      { name: "কোতোয়ালী", slug: "kotwali-sylhet" },
      { name: "দক্ষিণ সুরমা", slug: "dakshin-surma" },
      { name: "শাহপরাণ", slug: "shah-poran" },
      { name: "বিশ্বনাথ", slug: "biswanath" },
      { name: "ওসমানীনগর", slug: "osmani-nagar" },
      { name: "বিয়ানীবাজার", slug: "beanibazar" },
      { name: "গোলাপগঞ্জ", slug: "golapganj" },
      { name: "ফেঞ্চুগঞ্জ", slug: "fenchuganj" },
      { name: "জকিগঞ্জ", slug: "zakiganj" },
      { name: "গোয়াইনঘাট", slug: "gowainghat" },
      { name: "জৈন্তাপুর", slug: "jaintiapur" },
      { name: "কোম্পানীগঞ্জ", slug: "companiganj-sylhet" },
      { name: "কানাইঘাট", slug: "kanaighat" },
    ],
  },
  {
    name: "মৌলভীবাজার",
    slug: "moulvibazar",
    upazilas: [
      { name: "মৌলভীবাজার সদর", slug: "moulvibazar-sadar" },
      { name: "শ্রীমঙ্গল", slug: "sreemangal" },
      { name: "কমলগঞ্জ", slug: "kamalganj" },
      { name: "কুলাউড়া", slug: "kulaura" },
      { name: "বড়লেখা", slug: "barlekha" },
      { name: "জুড়ী", slug: "juri" },
      { name: "রাজনগর", slug: "rajnagar" },
    ],
  },
  {
    name: "হবিগঞ্জ",
    slug: "habiganj",
    upazilas: [
      { name: "হবিগঞ্জ সদর", slug: "habiganj-sadar" },
      { name: "মাধবপুর", slug: "madhabpur" },
      { name: "চুনারুঘাট", slug: "chunarughat" },
      { name: "বাহুবল", slug: "bahubal" },
      { name: "নবীগঞ্জ", slug: "nabiganj" },
      { name: "বানিয়াচং", slug: "baniachong" },
      { name: "আজমিরীগঞ্জ", slug: "ajmiriganj" },
      { name: "লাখাই", slug: "lakhai" },
      { name: "শায়েস্তাগঞ্জ", slug: "shayestaganj" },
    ],
  },
  {
    name: "সুনামগঞ্জ",
    slug: "sunamganj",
    upazilas: [
      { name: "সুনামগঞ্জ সদর", slug: "sunamganj-sadar" },
      { name: "ছাতক", slug: "chhatak" },
      { name: "জগন্নাথপুর", slug: "jagannathpur" },
      { name: "তাহিরপুর", slug: "tahirpur" },
      { name: "দিরাই", slug: "derai" },
      { name: "শাল্লা", slug: "shalla" },
      { name: "ধর্মপাশা", slug: "dharmapasha" },
      { name: "জামালগঞ্জ", slug: "jamalganj" },
      { name: "বিশ্বম্ভরপুর", slug: "biswamvarpur" },
      { name: "দোয়ারাবাজার", slug: "dowarabazar" },
      { name: "শান্তিগঞ্জ", slug: "shantiganj" },
      { name: "মধ্যনগর", slug: "madhyanagar" },
    ],
  },

  // ── বরিশাল বিভাগ ─────────────────────────────────────────────────────────
  {
    name: "বরিশাল",
    slug: "barishal",
    upazilas: [
      { name: "কোতোয়ালী", slug: "kotwali-barishal" },
      { name: "বাকেরগঞ্জ", slug: "bakerganj" },
      { name: "বাবুগঞ্জ", slug: "babuganj" },
      { name: "উজিরপুর", slug: "wazirpur" },
      { name: "বানারীপাড়া", slug: "banaripara" },
      { name: "গৌরনদী", slug: "gournadi" },
      { name: "আগৈলঝাড়া", slug: "agailjhara" },
      { name: "মেহেন্দিগঞ্জ", slug: "mehendiganj" },
      { name: "হিজলা", slug: "hijla" },
      { name: "মুলাদী", slug: "muladi" },
    ],
  },
  {
    name: "পটুয়াখালী",
    slug: "patuakhali",
    upazilas: [
      { name: "পটুয়াখালী সদর", slug: "patuakhali-sadar" },
      { name: "বাউফল", slug: "bauphal" },
      { name: "গলাচিপা", slug: "galachipa" },
      { name: "কলাপাড়া", slug: "kalapara" },
      { name: "মির্জাগঞ্জ", slug: "mirzaganj" },
      { name: "দশমিনা", slug: "dashmina" },
      { name: "দুমকি", slug: "dumki" },
      { name: "রাঙ্গাবালী", slug: "rangabali" },
    ],
  },
  {
    name: "ভোলা",
    slug: "bhola",
    upazilas: [
      { name: "ভোলা সদর", slug: "bhola-sadar" },
      { name: "দৌলতখান", slug: "daulatkhan" },
      { name: "বোরহানউদ্দিন", slug: "borhanuddin" },
      { name: "লালমোহন", slug: "lalmohan" },
      { name: "চরফ্যাশন", slug: "charfasson" },
      { name: "তজুমদ্দিন", slug: "tazumuddin" },
      { name: "মনপুরা", slug: "manpura" },
    ],
  },
  {
    name: "পিরোজপুর",
    slug: "pirojpur",
    upazilas: [
      { name: "পিরোজপুর সদর", slug: "pirojpur-sadar" },
      { name: "ভাণ্ডারিয়া", slug: "bhandaria" },
      { name: "মঠবাড়িয়া", slug: "mathbaria" },
      { name: "নাজিরপুর", slug: "nazirpur" },
      { name: "নেছারাবাদ", slug: "nesarabad" },
      { name: "কাউখালী", slug: "kawkhali-pirojpur" },
      { name: "ইন্দুরকানী", slug: "indurkani" },
    ],
  },
  {
    name: "বরগুনা",
    slug: "barguna",
    upazilas: [
      { name: "বরগুনা সদর", slug: "barguna-sadar" },
      { name: "আমতলী", slug: "amtali" },
      { name: "পাথরঘাটা", slug: "patharghata" },
      { name: "বেতাগী", slug: "betagi" },
      { name: "বামনা", slug: "bamna" },
      { name: "তালতলী", slug: "taltali" },
    ],
  },
  {
    name: "ঝালকাঠি",
    slug: "jhalakathi",
    upazilas: [
      { name: "ঝালকাঠি সদর", slug: "jhalakathi-sadar" },
      { name: "নলছিটি", slug: "nalchity" },
      { name: "রাজাপুর", slug: "rajapur" },
      { name: "কাঠালিয়া", slug: "kathalia" },
    ],
  },

  // ── ময়মনসিংহ বিভাগ ───────────────────────────────────────────────────────
  {
    name: "ময়মনসিংহ",
    slug: "mymensingh",
    upazilas: [
      { name: "কোতোয়ালী", slug: "kotwali-mymensingh" },
      { name: "মুক্তাগাছা", slug: "muktagachha" },
      { name: "ত্রিশাল", slug: "trishal" },
      { name: "ভালুকা", slug: "bhaluka" },
      { name: "গৌরীপুর", slug: "gouripur" },
      { name: "ঈশ্বরগঞ্জ", slug: "ishwarganj" },
      { name: "নান্দাইল", slug: "nandail" },
      { name: "ফুলবাড়িয়া", slug: "fulbaria" },
      { name: "গফরগাঁও", slug: "gafargaon" },
      { name: "ফুলপুর", slug: "phulpur" },
      { name: "তারাকান্দা", slug: "tarakanda" },
      { name: "হালুয়াঘাট", slug: "haluaghat" },
      { name: "ধোবাউড়া", slug: "dhobaura" },
    ],
  },
  {
    name: "জামালপুর",
    slug: "jamalpur",
    upazilas: [
      { name: "জামালপুর সদর", slug: "jamalpur-sadar" },
      { name: "সরিষাবাড়ী", slug: "sarishabari" },
      { name: "মেলান্দহ", slug: "melandaha" },
      { name: "ইসলামপুর", slug: "islampur" },
      { name: "মাদারগঞ্জ", slug: "madarganj" },
      { name: "বকশীগঞ্জ", slug: "bakshiganj" },
      { name: "দেওয়ানগঞ্জ", slug: "dewanganj" },
    ],
  },
  {
    name: "নেত্রকোণা",
    slug: "netrokona",
    upazilas: [
      { name: "নেত্রকোণা সদর", slug: "netrokona-sadar" },
      { name: "দুর্গাপুর", slug: "durgapur-netrokona" },
      { name: "পূর্বধলা", slug: "purbadhala" },
      { name: "কেন্দুয়া", slug: "kendua" },
      { name: "কলমাকান্দা", slug: "kalmakanda" },
      { name: "মদন", slug: "madan" },
      { name: "মোহনগঞ্জ", slug: "mohangonj" },
      { name: "বারহাট্টা", slug: "barhatta" },
      { name: "আটপাড়া", slug: "atpara" },
      { name: "খালিয়াজুড়ি", slug: "khaliajuri" },
    ],
  },
  {
    name: "শেরপুর",
    slug: "sherpur",
    upazilas: [
      { name: "শেরপুর সদর", slug: "sherpur-sadar" },
      { name: "নকলা", slug: "nakla" },
      { name: "নালিতাবাড়ী", slug: "nalitabari" },
      { name: "ঝিনাইগাতী", slug: "jhenaigati" },
      { name: "শ্রীবরদী", slug: "sreebardi" },
    ],
  },
];

export const seedServices = async (): Promise<void> => {
  console.log(`\n⏳ Seeding ${SEED_SERVICES.length} professional Bangla land services...`);
  for (const [idx, service] of SEED_SERVICES.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        description: service.description,
      },
      create: service,
    });
    console.log(`  [${idx + 1}/${SEED_SERVICES.length}] 🌾 ${service.name}`);
  }
  console.log(`✅ All ${SEED_SERVICES.length} services seeded successfully!\n`);
};

export const seedDistrictsAndUpazilas = async (): Promise<void> => {
  console.log(`\n⏳ Seeding ${SEED_DISTRICTS.length} districts and all upazilas of Bangladesh...`);
  for (const [idx, item] of SEED_DISTRICTS.entries()) {
    const district = await prisma.district.upsert({
      where: { slug: item.slug },
      update: { name: item.name },
      create: { name: item.name, slug: item.slug },
    });

    for (const upazila of item.upazilas) {
      await prisma.upazila.upsert({
        where: {
          districtId_slug: {
            districtId: district.id,
            slug: upazila.slug,
          },
        },
        update: { name: upazila.name },
        create: {
          name: upazila.name,
          slug: upazila.slug,
          districtId: district.id,
        },
      });
    }
    console.log(`  [${idx + 1}/${SEED_DISTRICTS.length}] 📍 জেলা: ${item.name} (${item.upazilas.length}টি উপজেলা)`);
  }
  console.log(`✅ All ${SEED_DISTRICTS.length} districts and upazilas seeded successfully!\n`);
};

export const seedSurveyor = async (): Promise<void> => {
  const existing = await prisma.user.findUnique({
    where: { email: SURVEYOR_EMAIL },
  });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(SURVEYOR_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: SURVEYOR_NAME,
      email: SURVEYOR_EMAIL,
      password: passwordHash,
      role: "SURVEYOR",
      emailVerified: true,
      status: "ACTIVE",
      district: "ঢাকা",
      upazila: "তেজগাঁও",
      surveyorProfile: {
        create: {
          slug: "demo-surveyor",
          headline: "অভিজ্ঞ পেশাদার ভূমি জরিপকারী ও ডিজিটাল সার্ভেয়ার",
          bio: "আমি দীর্ঘ ১০ বছর ধরে বিশ্বস্ততার সাথে জমি জরিপ, সীমানা চিহ্নিতকরণ, জমি বাটোয়ারা ও ডিজিটাল নকশার কাজ করে আসছি।",
          experienceYears: 10,
          verificationStatus: "APPROVED",
          isVerified: true,
          verifiedAt: new Date(),
          surveyorServices: {
            create: [
              { service: { connect: { slug: "land-measurement" } }, startingPrice: 900 },
              { service: { connect: { slug: "land-division" } }, startingPrice: 2500 },
              { service: { connect: { slug: "boundary-demarcation" } }, startingPrice: 1500 },
              { service: { connect: { slug: "digital-survey" } }, startingPrice: 5000 },
            ],
          },
          serviceAreas: {
            create: [
              { district: "ঢাকা", upazilas: ["তেজগাঁও", "গুলশান", "ধানমন্ডি", "মিরপুর"] },
              { district: "গাজীপুর", upazilas: ["গাজীপুর সদর", "টঙ্গী"] },
            ],
          },
        },
      },
    },
  });

  console.log(`Surveyor seeded successfully: ${SURVEYOR_EMAIL}`);
};

export const resetAndSeedAll = async (): Promise<void> => {
  console.log("Clearing all existing database records...");

  // Delete child records first to respect foreign key constraints
  await prisma.surveyorReview.deleteMany();
  await prisma.surveyorService.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.surveyorProfile.deleteMany();
  await prisma.service.deleteMany();
  await prisma.upazila.deleteMany();
  await prisma.district.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleared successfully.");

  // Run full fresh seeding
  await seedAdmin();
  await seedDistrictsAndUpazilas();
  await seedServices();
  await seedSurveyor();

  console.log("Fresh seed completed successfully!");
};

