import type { Dict } from "./types.ts";

/**
 * Roman Urdu: Urdu written in Latin letters, the way people type it in chat.
 * Common tech words (prompt, test case, pass rate, dashboard) stay in English, as they do in daily use.
 */
export const ru: Dict = {
  // Navigation
  "nav.features": "Khaasiyaat",
  "nav.how": "Yeh Kaise Kaam Karta Hai",
  "nav.demo": "Demo Dekhein",
  "nav.signIn": "Sign In Karein",
  "nav.getStarted": "Muft Shuru Karein",
  "nav.dashboard": "Dashboard",
  "nav.menu": "Menu kholein",
  "nav.closeMenu": "Menu band karein",
  "nav.language": "Zabaan",
  "nav.skip": "Seedha content par jayein",
  "nav.main": "Asal navigation",

  // Hero
  "hero.title": "Andaaze Lagana Chhorein. Apne AI Prompts Ko Test Karna Shuru Karein.",
  "hero.subtitle":
    "AI prompts ko saath saath rakh kar compare karein, asli test cases par unki performance parkhein, aur jaanein ke kya sab se behtar kaam karta hai — andaazon se nahi, napay jaa sakne wale nataij se.",
  "hero.primary": "Muft Shuru Karein",
  "hero.secondary": "Interactive Demo Dekhein",

  // Interactive preview
  "preview.title": "Prompt Lab ki jhalak",
  "preview.note": "Yeh simulated demo model hai. Koi API call nahi, koi kharcha nahi.",
  "preview.promptA": "Prompt A",
  "preview.promptB": "Prompt B",
  "preview.run": "Demo chalayein",
  "preview.running": "Chal raha hai…",
  "preview.reset": "Dobara chalayein",
  "preview.case": "Test case",
  "preview.passed": "{total} mein se {count} pass hue",
  "preview.winner": "Prompt {side} {points} points se jeet gaya",
  "preview.tie": "Barabar ka muqabla",
  "preview.view3d": "3D mein dekhein",
  "preview.hide3d": "3D view chhupayein",
  "preview.openDemo": "Poora demo kholein",
  "preview.waiting": "Intezaar",
  "preview.pass": "Pass",
  "preview.fail": "Fail",

  // Features
  "features.title": "Prompt behtar banane ke liye sab kuch",
  "features.intro": "Assay prompt mein tabdeeli ko aisa experiment bana deta hai jo baar baar dohraya ja sake.",
  "f1.title": "Prompt A/B Testing",
  "f1.body": "Do alag AI prompts ko ek jaise test cases par compare karein aur dekhein ke kaun behtar kaam karta hai.",
  "f2.title": "Khud-kaar Evaluation",
  "f2.body": "Exact match, regex, JSON validation aur doosre scoring tareeqon se AI ke jawabaat ko parkhein.",
  "f3.title": "Performance Analytics",
  "f3.body": "Pass rate, response latency, token ka istemaal (jahan maujood ho) aur API ka andaazan kharcha samjhein.",
  "f4.title": "Interactive Visualizations",
  "f4.body": "Assay ke maujooda visual analytics aur 3D components se prompts ki performance explore karein.",
  "f5.title": "Experiment History",
  "f5.body": "Experiments save karein, purane comparisons dobara dekhein, aur behtari ka silsila track karein.",
  "f6.title": "Tez Prompt Engineering",
  "f6.body":
    "Baar baar haath se test karne ki mehnat kam karein aur napay jaa sakne wale saboot ki bunyaad par prompts behtar banayein.",

  // How it works
  "how.title": "Idea se saboot tak, teen qadam mein",
  "how.step": "Qadam {n}",
  "how.s1.title": "Apne Prompts Likhein",
  "how.s1.body": "AI prompt ke do versions banayein.",
  "how.s2.title": "Apne Tests Chalayein",
  "how.s2.body": "Dono prompts ko ek jaise test cases par parkhein.",
  "how.s3.title": "Compare Karein Aur Behtar Banayein",
  "how.s3.body": "Nataij dekhein aur apne prompts ko optimize karein.",

  // Final call to action
  "cta.title": "Behtar AI Prompts Banane Ke Liye Tayyar Hain?",
  "cta.body": "Assay se jur jayein aur prompt ke tajurbe ko ek munazzam, napay jaa sakne wale amal mein badal dein.",
  "cta.primary": "Muft Account Banayein",
  "cta.secondary": "Demo Aazmayein",

  // Footer
  "footer.tagline": "Behtar AI prompts test karein, apna waqt bachayein, aur AI ki performance improve karein.",
  "footer.built": "Next.js, Supabase aur React Three Fiber se banaya gaya.",

  // Shared auth text
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.confirm": "Password dobara likhein",
  "auth.name": "Naam",
  "auth.show": "Password dikhayein",
  "auth.hide": "Password chhupayein",
  "auth.or": "ya",
  "auth.google": "Google se jari rakhein",
  "auth.notConfigured":
    "Is server par sign-in abhi set up nahi hua. Supabase ke environment variables shamil karein, ya demo aazmayein.",
  "auth.home": "Home par wapas",

  // Login
  "login.title": "Assay Mein Khush Aamdeed.",
  "login.body": "Apne AI prompts ko test, compare aur behtar banana jari rakhne ke liye sign in karein.",
  "login.submit": "Sign in karein",
  "login.submitting": "Sign in ho raha hai…",
  "login.forgot": "Password bhool gaye?",
  "login.noAccount": "Assay par naye hain?",
  "login.signupLink": "Muft account banayein",
  "login.callbackError": "Woh sign-in link kaam nahi kar saka. Baraye meherbani dobara koshish karein.",

  // Signup
  "signup.title": "Behtar Prompts Banana Shuru Karein.",
  "signup.body":
    "AI prompts compare karne, experiments save karne aur apni progress track karne ke liye apna muft Assay account banayein.",
  "signup.submit": "Account banayein",
  "signup.submitting": "Account ban raha hai…",
  "signup.haveAccount": "Pehle se account hai?",
  "signup.loginLink": "Sign in karein",
  "signup.successTitle": "Apni email dekhein",
  "signup.successBody": "Humne {email} par tasdeeq ka link bheja hai. Account mukammal karne ke liye usay kholein.",
  "signup.passwordHint": "Kam az kam 8 characters istemaal karein.",

  // Forgot password
  "forgot.title": "Apna password reset karein",
  "forgot.body": "Apni email likhein, hum naya password chunne ka link bhej denge.",
  "forgot.submit": "Reset link bhejein",
  "forgot.sending": "Bheja ja raha hai…",
  "forgot.successTitle": "Apni email dekhein",
  "forgot.successBody":
    "Agar {email} ka account maujood hai to reset link bheja ja chuka hai. Pahunchne mein ek minute lag sakta hai.",
  "forgot.back": "Sign in par wapas",

  // Reset password
  "reset.title": "Naya password chunein",
  "reset.body": "Aisa password chunein jo aap ne pehle istemaal na kiya ho.",
  "reset.password": "Naya password",
  "reset.submit": "Password update karein",
  "reset.updating": "Update ho raha hai…",
  "reset.successTitle": "Password update ho gaya",
  "reset.successBody": "Aap naye password ke saath sign in hain.",
  "reset.invalidTitle": "Is reset link ki mudat khatam ho gayi",
  "reset.invalidBody":
    "Reset link sirf ek baar kaam karta hai aur jaldi expire ho jata hai. Jari rakhne ke liye naya link mangwayein.",
  "reset.requestNew": "Naya link mangwayein",
  "reset.checking": "Aap ka link check ho raha hai…",

  // Form validation
  "err.nameRequired": "Apna naam likhein.",
  "err.nameLong": "Naam 60 characters se zyada nahi ho sakta.",
  "err.emailRequired": "Apni email likhein.",
  "err.emailInvalid": "Durust email address likhein.",
  "err.passwordRequired": "Password likhein.",
  "err.passwordShort": "Password kam az kam 8 characters ka hona chahiye.",
  "err.passwordLong": "Password bohat lamba hai. Isay 72 bytes se kam rakhein.",
  "err.passwordMismatch": "Dono password aapas mein nahi milte.",

  // Auth service errors
  "authErr.invalidCredentials": "Email ya password durust nahi. Dobara koshish karein.",
  "authErr.emailNotConfirmed": "Pehle apni email tasdeeq karein. Humne jo link bheja tha usay kholein.",
  "authErr.rateLimited": "Bohat zyada koshishein ho gayi hain. Thori der baad dobara koshish karein.",
  "authErr.weakPassword": "Yeh password bohat kamzor hai. Zyada lamba ya mushkil password chunein.",
  "authErr.sameAsOld": "Naya password purane se mukhtalif hona chahiye.",
  "authErr.sessionExpired": "Aap ka session khatam ho gaya. Baraye meherbani dobara sign in karein.",
  "authErr.signupDisabled": "Filhal naye accounts nahi ban rahe.",
  "authErr.network": "Server tak pahunch nahi sakay. Apna internet check karein aur dobara koshish karein.",
  "authErr.generic": "Kuch ghalat ho gaya. Baraye meherbani dobara koshish karein.",

  // App navigation
  "app.dashboard": "Dashboard",
  "app.lab": "Prompt Lab",
  "app.history": "History",
  "app.account": "Account",
  "app.signOut": "Sign out karein",

  // Dashboard
  "dash.welcome": "Wapas khush aamdeed, {name}",
  "dash.subtitle": "Aap ke AI prompt experiments, sab ek jagah.",
  "dash.total": "Kul experiments",
  "dash.completed": "Mukammal comparisons",
  "dash.completedHint": "Har jawab wapas aaya",
  "dash.avgPass": "Ausat pass rate",
  "dash.avgPassHint": "Tamam prompts ka",
  "dash.latest": "Sab se taaza experiment",
  "dash.noneYet": "Abhi koi nahi",
  "dash.recent": "Haal ke experiments",
  "dash.colName": "Experiment",
  "dash.colDate": "Tareekh",
  "dash.colA": "Prompt A",
  "dash.colB": "Prompt B",
  "dash.colStatus": "Nateeja",
  "dash.view": "Tafseel dekhein",
  "dash.statusA": "Prompt A jeeta",
  "dash.statusB": "Prompt B jeeta",
  "dash.statusTie": "Barabar",
  "dash.statusIncomplete": "Kuch calls fail hui",
  "dash.quick": "Fori kaam",
  "dash.qaNew": "Naya experiment",
  "dash.qaLab": "Prompt Lab kholein",
  "dash.qaHistory": "History dekhein",
  "dash.qaDemo": "Demo dekhein",
  "dash.emptyTitle": "Aap Ka Prompt Engineering Safar Yahan Se Shuru Hota Hai.",
  "dash.emptyBody": "Apna pehla comparison chalayein aur jaanein ke kaun sa AI prompt behtar perform karta hai.",
  "dash.emptyCta": "Pehla Experiment Shuru Karein",
  "dash.errorTitle": "Aap ke experiments load nahi ho sakay",
  "dash.errorBody": "Apna connection check karein aur dobara koshish karein.",
  "dash.retry": "Dobara koshish karein",
  "dash.latestOf": "Aap ke taaza {count} experiments ki bunyaad par.",

  // Account
  "acct.title": "Account",
  "acct.subtitle": "Apne account ki tafseelat sambhalein.",
  "acct.name": "Display naam",
  "acct.email": "Email",
  "acct.language": "Pasandeeda zabaan",
  "acct.since": "Rukn banne ki tareekh",
  "acct.save": "Tabdeeliyan save karein",
  "acct.saving": "Save ho raha hai…",
  "acct.saved": "Tabdeeliyan save ho gayin.",
  "acct.saveError": "Aap ki tabdeeliyan save nahi ho sakin. Dobara koshish karein.",
  "acct.emailNote": "Aap ki email sign in ke liye istemaal hoti hai aur yahan se badli nahi ja sakti.",
  "acct.password": "Password badlein",
  "acct.newPassword": "Naya password",
  "acct.updatePassword": "Password update karein",
  "acct.passwordUpdated": "Password update ho gaya.",
  "acct.signOut": "Sign out karein",

  // Importing runs saved in the browser before accounts existed
  "legacy.title": "Is browser mein save kiye gaye experiments import karein",
  "legacy.body": "Account se pehle ke {count} experiments mile hain. Unhein mehfooz rakhne ke liye apne account mein import karein.",
  "legacy.button": "{count} experiments import karein",
  "legacy.busy": "Import ho raha hai…",
  "legacy.done": "{count} experiments import ho gaye.",
  "legacy.failed": "{count} import nahi ho sakay.",

  // Demo page
  "demo.title": "Demo dekhein",
  "demo.body": "Simulated model ke saath do prompts compare karein. Kuch save nahi hota aur koi paid API call nahi hoti.",
  "demo.ctaTitle": "Asli models chalana chahte hain?",
  "demo.ctaBody": "Asli models chalane aur apni history mehfooz rakhne ke liye muft account banayein.",
  "demo.ctaButton": "Muft Account Banayein",
};
