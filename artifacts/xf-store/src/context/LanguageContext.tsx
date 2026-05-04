import React, { createContext, useContext, useEffect, useState } from "react";

export type Lang = "en" | "de";

export const translations = {
  en: {
    nav: {
      home: "Home", shop: "Shop", about: "About Us", contact: "Contact",
      settings: "Settings", signOut: "Sign Out", signIn: "Sign In", register: "Register",
      lightMode: "Light Mode", darkMode: "Dark Mode", staff: "Staff", founder: "Founder",
      support: "Support",
    },
    home: {
      releasingSoon: "RELEASING SOON", unseenCollection: "UNSEEN COLLECTION",
      by: "XF by Xavier & Fynn", days: "DAYS", hours: "HOURS", minutes: "MINUTES",
      notifyPlaceholder: "Be the first to know", notifyBtn: "Notify Me",
      onList: "You're on the list.",
      viewCollection: "View Collection", fromTheDrop: "From The Drop",
      availableNow: "Available Now", shopAll: "Shop All",
    },
    shop: {
      collection: "XF Collection", drop: "FX DROP",
      hoodies: "Hoodies", tshirts: "T-Shirts", jogger: "JOGGER",
      viewProduct: "View Product",
    },
    product: {
      description: "Description", size: "Size", addToCart: "Add to Cart",
      addedToCart: "Added to Cart ✓", selectSize: "Please select a size",
      notFound: "Product not found",
      freeShipping: "Free shipping on orders over €150",
      returnPolicy: "14-day return policy",
      designedIn: "Designed in Studio",
    },
    cart: {
      title: "Cart", empty: "Your cart is empty", size: "Size",
      total: "Total", checkout: "Checkout",
    },
    login: {
      signIn: "Sign In", signUp: "Sign Up", name: "Name", email: "Email",
      password: "Password", yourName: "Your name", forgotPassword: "Forgot password?",
      createAccount: "Create Account", newHere: "New here?", alreadyHave: "Already have an account?",
      signUpLink: "Sign up", signInLink: "Sign in", verifying: "Verifying...",
      sending: "...",
      twoFactor: "Two-Factor Auth", twoFactorDesc: "Open your authenticator app and enter the 6-digit code.",
      security: "Security", confirm: "Confirm", back: "← Back",
      verifyEmail: "Verify Email", checkInbox: "Check Your Inbox",
      codeSentTo: "We sent an 8-digit code to",
      verificationCode: "Verification Code", verifyAndContinue: "Verify & Continue",
      didntReceive: "Didn't receive it?", codeSent: "Code sent!", resending: "Sending...",
      resendCode: "Resend Code",
      nameRequired: "Name is required",
      codeExpired: "Code expired. Request a new one below.",
      invalidCode: "Invalid code. Please check your email and try again.",
      waitBefore: "Please wait a few seconds before requesting a new code.",
      wrongCode: "Wrong code — try again",
      fullCode: "Please enter the full 8-digit code.",
    },
    account: {
      title: "My Account", profile: "Profile", name: "Name", email: "Email",
      security: "Security", twoFA: "Two-Factor Authentication",
      twoFAEnabled: "Enabled — your account is protected",
      twoFADisabled: "Not enabled",
      enable2FA: "Enable", disable2FA: "Disable",
      shippingAddresses: "Shipping Addresses", addAddress: "Add Address",
      noAddresses: "No addresses saved yet", label: "Label", optional: "optional",
      address: "Address", saveAddress: "Save Address", saving: "Saving...",
      setDefault: "Set as default", default: "Default",
      orderHistory: "Order History", noOrders: "No orders yet",
      signOut: "Sign Out", cancel: "Cancel Order", cancelReason: "Reason for cancellation...",
      cancelConfirm: "Confirm Cancel", cancelling: "Cancelling...",
      deleteOrder: "Delete", deletingOrder: "Deleting...",
      setup2FA: "Enable 2FA", setup2FADesc: "Scan the QR code with an authenticator app (e.g. Google Authenticator, Authy) and enter the 6-digit code.",
      manualKey: "Manual Key",
      confirmEnable: "Confirm & Enable", checking: "Checking...",
      disable2FATitle: "Disable 2FA", disable2FADesc: "Enter the 6-digit code from your authenticator app to disable 2FA.",
      disable2FAEmailDesc: "We'll send a code to your email to confirm. Enter it below to disable 2FA.",
      disabling: "Disabling...",
      choose2FAMethod: "Choose 2FA Method",
      choose2FAMethodDesc: "How would you like to receive your verification codes?",
      twoFAMethodApp: "Authenticator App",
      twoFAMethodAppDesc: "Use Google Authenticator, Authy, or any TOTP app",
      twoFAMethodEmail: "Email",
      twoFAMethodEmailDesc: "Receive a one-time code to your email address",
      twoFAEnabledApp: "App — use your authenticator",
      twoFAEnabledEmail: "Email — code sent on login",
      sendCode: "Send Code",
      sendingCode: "Sending...",
      codeSentCheckEmail: "Code sent — check your inbox",
      cancelOrder: "Cancel Order", cancelOrderDesc: "Please provide a reason. This action cannot be undone.",
      cancelBtn: "Cancel Order", back: "Back",
      cancelledReason: "Reason",
    },
    footer: {
      tagline: "A new generation of streetwear.",
      links: "Links", social: "Social",
      shop: "Shop", about: "About Us", contact: "Contact",
      copyright: "© XF",
    },
    common: {
      loading: "Loading...", error: "An error occurred.",
    },
  },
  de: {
    nav: {
      home: "Start", shop: "Shop", about: "Über uns", contact: "Kontakt",
      settings: "Einstellungen", signOut: "Abmelden", signIn: "Anmelden", register: "Registrieren",
      lightMode: "Hell-Modus", darkMode: "Dunkel-Modus", staff: "Personal", founder: "Gründer",
      support: "Support",
    },
    home: {
      releasingSoon: "BALD VERFÜGBAR", unseenCollection: "UNSEEN KOLLEKTION",
      by: "XF von Xavier & Fynn", days: "TAGE", hours: "STUNDEN", minutes: "MINUTEN",
      notifyPlaceholder: "Als Erster informiert werden", notifyBtn: "Benachrichtigen",
      onList: "Du bist auf der Liste.",
      viewCollection: "Kollektion ansehen", fromTheDrop: "Aus dem Drop",
      availableNow: "Jetzt verfügbar", shopAll: "Alles ansehen",
    },
    shop: {
      collection: "XF Kollektion", drop: "FX DROP",
      hoodies: "Hoodies", tshirts: "T-Shirts", jogger: "JOGGER",
      viewProduct: "Produkt ansehen",
    },
    product: {
      description: "Beschreibung", size: "Größe", addToCart: "In den Warenkorb",
      addedToCart: "Hinzugefügt ✓", selectSize: "Bitte Größe auswählen",
      notFound: "Produkt nicht gefunden",
      freeShipping: "Kostenloser Versand ab €150",
      returnPolicy: "14-tägiges Rückgaberecht",
      designedIn: "Im Studio entworfen",
    },
    cart: {
      title: "Warenkorb", empty: "Dein Warenkorb ist leer", size: "Größe",
      total: "Gesamt", checkout: "Zur Kasse",
    },
    login: {
      signIn: "Anmelden", signUp: "Registrieren", name: "Name", email: "E-Mail",
      password: "Passwort", yourName: "Dein Name", forgotPassword: "Passwort vergessen?",
      createAccount: "Konto erstellen", newHere: "Neu hier?", alreadyHave: "Bereits ein Konto?",
      signUpLink: "Registrieren", signInLink: "Anmelden", verifying: "Wird geprüft...",
      sending: "...",
      twoFactor: "Zwei-Faktor-Auth", twoFactorDesc: "Öffne deine Authenticator-App und gib den 6-stelligen Code ein.",
      security: "Sicherheit", confirm: "Bestätigen", back: "← Zurück",
      verifyEmail: "E-Mail bestätigen", checkInbox: "Postfach prüfen",
      codeSentTo: "Wir haben einen 8-stelligen Code gesendet an",
      verificationCode: "Bestätigungscode", verifyAndContinue: "Bestätigen & weiter",
      didntReceive: "Nichts erhalten?", codeSent: "Code gesendet!", resending: "Wird gesendet...",
      resendCode: "Code erneut senden",
      nameRequired: "Name ist erforderlich",
      codeExpired: "Code abgelaufen. Fordere unten einen neuen an.",
      invalidCode: "Ungültiger Code. Bitte E-Mail prüfen und erneut versuchen.",
      waitBefore: "Bitte ein paar Sekunden warten, bevor ein neuer Code angefordert wird.",
      wrongCode: "Falscher Code — bitte nochmal versuchen",
      fullCode: "Bitte vollständigen 8-stelligen Code eingeben.",
    },
    account: {
      title: "Mein Konto", profile: "Profil", name: "Name", email: "E-Mail",
      security: "Sicherheit", twoFA: "Zwei-Faktor-Authentifizierung",
      twoFAEnabled: "Aktiviert — dein Konto ist geschützt",
      twoFADisabled: "Nicht aktiviert",
      enable2FA: "Aktivieren", disable2FA: "Deaktivieren",
      shippingAddresses: "Lieferadressen", addAddress: "Adresse hinzufügen",
      noAddresses: "Noch keine Adressen gespeichert", label: "Bezeichnung", optional: "optional",
      address: "Adresse", saveAddress: "Adresse speichern", saving: "Wird gespeichert...",
      setDefault: "Als Standard setzen", default: "Standard",
      orderHistory: "Bestellverlauf", noOrders: "Noch keine Bestellungen",
      signOut: "Abmelden", cancel: "Bestellung stornieren", cancelReason: "Grund für die Stornierung...",
      cancelConfirm: "Stornieren bestätigen", cancelling: "Wird storniert...",
      deleteOrder: "Löschen", deletingOrder: "Wird gelöscht...",
      setup2FA: "2FA aktivieren", setup2FADesc: "Scanne den QR-Code mit einer Authenticator-App (z.B. Google Authenticator, Authy) und gib dann den 6-stelligen Code ein.",
      manualKey: "Manueller Schlüssel",
      confirmEnable: "Bestätigen & aktivieren", checking: "Wird geprüft...",
      disable2FATitle: "2FA deaktivieren", disable2FADesc: "Gib den 6-stelligen Code aus deiner Authenticator-App ein, um 2FA zu deaktivieren.",
      disable2FAEmailDesc: "Wir senden dir einen Code per E-Mail zur Bestätigung. Gib ihn unten ein, um 2FA zu deaktivieren.",
      disabling: "Wird deaktiviert...",
      choose2FAMethod: "2FA-Methode wählen",
      choose2FAMethodDesc: "Wie möchtest du deine Bestätigungscodes erhalten?",
      twoFAMethodApp: "Authenticator-App",
      twoFAMethodAppDesc: "Nutze Google Authenticator, Authy oder eine andere TOTP-App",
      twoFAMethodEmail: "E-Mail",
      twoFAMethodEmailDesc: "Erhalte einen einmaligen Code per E-Mail",
      twoFAEnabledApp: "App — nutze deinen Authenticator",
      twoFAEnabledEmail: "E-Mail — Code wird beim Login gesendet",
      sendCode: "Code senden",
      sendingCode: "Wird gesendet...",
      codeSentCheckEmail: "Code gesendet — Postfach prüfen",
      cancelOrder: "Bestellung stornieren", cancelOrderDesc: "Bitte gib einen Grund an. Diese Aktion kann nicht rückgängig gemacht werden.",
      cancelBtn: "Stornieren", back: "Abbrechen",
      cancelledReason: "Grund",
    },
    footer: {
      tagline: "Eine neue Generation Streetwear.",
      links: "Links", social: "Sozial",
      shop: "Shop", about: "Über uns", contact: "Kontakt",
      copyright: "© XF",
    },
    common: {
      loading: "Wird geladen...", error: "Ein Fehler ist aufgetreten.",
    },
  },
} as const;

export type Translations = typeof translations.en;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("xf-lang") as Lang) || "en";
  });

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("xf-lang", l);
  }

  const t = translations[lang] as Translations;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
