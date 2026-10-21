/* Comportements communs : robot en SVG, textes de config, mots entourés, parcours et formulaires. */
(function () {
  const S = window.SITE || {};

  /* Le robot rond (même personnage que dans les Reels). variant : yellow | blue | ink, eyes : normal | happy | heart | star */
  function robot(variant = "yellow", eyes = "normal") {
    const body = { yellow: "#fac834", blue: "#2440c9", ink: "#141a33" }[variant] || "#fac834";
    const eye = variant === "yellow" ? "#1c1626" : "#ffe14d";
    let e = `<rect x="22" y="27" width="6" height="12" rx="3" fill="${eye}"/><rect x="36" y="27" width="6" height="12" rx="3" fill="${eye}"/>`;
    if (eyes === "happy") e = `<path d="M20 35l5-6 5 6M34 35l5-6 5 6" fill="none" stroke="${eye}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (eyes === "heart") e = `<path d="M25 39c-6-4-7-9-3.5-10.5 2-.8 3.5.6 3.5 1.8 0-1.2 1.5-2.6 3.5-1.8C32 30 31 35 25 39zM39 39c-6-4-7-9-3.5-10.5 2-.8 3.5.6 3.5 1.8 0-1.2 1.5-2.6 3.5-1.8C46 30 45 35 39 39z" fill="#e8355a"/>`;
    if (eyes === "star") e = `<path d="M25 26l2 4.5 4.8.4-3.7 3.1 1.2 4.7L25 36.2l-4.3 2.5 1.2-4.7-3.7-3.1 4.8-.4zM39 26l2 4.5 4.8.4-3.7 3.1 1.2 4.7L39 36.2l-4.3 2.5 1.2-4.7-3.7-3.1 4.8-.4z" fill="#e2601c"/>`;
    return `<svg viewBox="0 0 64 64" aria-hidden="true">
      <line x1="32" y1="14" x2="32" y2="6" stroke="${body}" stroke-width="3"/><circle cx="32" cy="5" r="4" fill="#ec7c54"/>
      <circle cx="9" cy="36" r="5" fill="${body}"/><circle cx="55" cy="36" r="5" fill="${body}"/>
      <path d="M22 52l-2 7M29 54l-1 7M35 54l1 7M42 52l2 7" stroke="${body}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="32" cy="34" r="20" fill="${body}"/>${e}
      <path d="M27 44q5 4 10 0" fill="none" stroke="${eye}" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  }
  document.querySelectorAll("[data-robot]").forEach(el => {
    const [variant, eyes] = (el.dataset.robot || "yellow").split(":");
    el.innerHTML = robot(variant, eyes);
  });

  /* Textes et liens venant de config.js */
  document.querySelectorAll("[data-brand]").forEach(el => (el.textContent = S.brand || ""));
  document.querySelectorAll("[data-price]").forEach(el => (el.textContent = S.guidePrice || ""));
  document.querySelectorAll("[data-price-old]").forEach(el => { if (S.guidePriceOld) el.textContent = S.guidePriceOld; else el.hidden = true; });
  document.querySelectorAll("[data-note]").forEach(el => (el.textContent = S.guideNote || ""));
  document.querySelectorAll("[data-instagram]").forEach(el => { if (S.instagram) el.href = S.instagram; else el.hidden = true; });
  document.querySelectorAll("[data-buy]").forEach(el => {
    el.href = S.stripeLink || "#acheter";
    if (!S.stripeLink) el.addEventListener("click", e => { e.preventDefault(); alert("Lien de paiement à ajouter dans config.js (stripeLink)."); });
  });
  document.querySelectorAll("[data-calendly]").forEach(el => { if (S.calendly) el.href = S.calendly; else el.hidden = true; });
  document.title = document.title.replace("{brand}", S.brand || "");

  /* Mots entourés à la main */
  document.querySelectorAll(".circled").forEach(el => {
    el.insertAdjacentHTML("beforeend", `<svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
      <path d="M12 34 C 8 12, 90 2, 150 6 S 200 22, 192 36 S 120 58, 60 56 S 2 44, 18 22 C 30 10, 70 6, 96 7"/></svg>`);
  });

  /* Envoi d'un formulaire : Formspree si configuré, sinon ouverture de l'app mail */
  async function send(form, data, okEl) {
    const btn = form.querySelector("button[type=submit]");
    if (S.formEndpoint) {
      btn.disabled = true;
      try {
        const r = await fetch(S.formEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error();
        form.hidden = true; okEl.style.display = "block";
      } catch (_) { btn.disabled = false; alert("L'envoi n'a pas marché. Réessaie, ou écris-moi sur Instagram."); }
    } else {
      const body = Object.entries(data).map(([k, v]) => `${k} : ${v}`).join("\n");
      location.href = `mailto:${S.email}?subject=${encodeURIComponent(data.sujet || "Nouveau message")}&body=${encodeURIComponent(body)}`;
      form.hidden = true; okEl.style.display = "block";
    }
  }

  /* Parcours « entreprise » : une question par écran */
  const quiz = document.querySelector("[data-quiz]");
  if (quiz) {
    const steps = [...quiz.querySelectorAll(".step")];
    const answers = {};
    const show = i => {
      steps.forEach((s, k) => s.classList.toggle("on", k === i));
      document.querySelectorAll(".progress span").forEach((p, k) => p.classList.toggle("on", k <= i));
      window.scrollTo({ top: 0, behavior: "smooth" });
      quiz.dataset.at = i;
    };
    quiz.querySelectorAll(".opt").forEach(o => o.addEventListener("click", () => {
      const step = o.closest(".step"); answers[step.dataset.key] = o.dataset.value || o.firstChild.textContent.trim();
      const i = steps.indexOf(step) + 1;
      if (steps[i] && steps[i].querySelector(".summary"))
        steps[i].querySelector(".summary").innerHTML = Object.values(answers).map(a => `<span>${a}</span>`).join("");
      show(i);
    }));
    const back = document.querySelector("[data-back]");
    back.addEventListener("click", e => { const at = +quiz.dataset.at || 0; if (at > 0) { e.preventDefault(); show(at - 1); } });
    const form = quiz.querySelector("form");
    form.addEventListener("submit", e => {
      e.preventDefault();
      const f = new FormData(form);
      send(form, { sujet: "Demande entreprise", taille: answers.taille, besoin: answers.besoin, nom: f.get("nom"), email: f.get("email"), message: f.get("message") },
           quiz.querySelector(".ok"));
    });
    show(0);
  }

  /* Préinscription communauté */
  const wait = document.querySelector("[data-waitlist]");
  if (wait) wait.addEventListener("submit", e => {
    e.preventDefault();
    send(wait, { sujet: "Préinscription communauté", email: new FormData(wait).get("email") }, document.querySelector("[data-waitlist-ok]"));
  });

  document.querySelectorAll("[data-year]").forEach(el => (el.textContent = new Date().getFullYear()));
})();
