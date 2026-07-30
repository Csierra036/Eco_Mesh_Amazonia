import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
gsap.registerPlugin(Flip);

export class Prettymodal {
  constructor() {
    console.log("Hola desde prettymodal");
  }

  open(dialogID, event) {
    const dialog = document.getElementById(dialogID);
    if (!dialog || !event) return;

    const origin = event.currentTarget;
    const randomId = Math.random().toString(16).slice(2);
    dialog.dataset.flipId = randomId;
    origin.dataset.flipId = randomId;

    const originRadius = getComputedStyle(origin).borderRadius;
    const originState = Flip.getState(origin);

    gsap.set(dialog, { visibility: "hidden" });
    dialog.showModal();

    const targetRadius = getComputedStyle(dialog).borderRadius;

    dialog.addEventListener(
      "cancel",
      (e) => {
        e.preventDefault();
        this.close(dialogID, true);
      },
      { once: true }
    );

    const tl = gsap.timeline({
      onStart: () => {
        dialog.style.willChange = "width, height, top, left, border-radius, transform";
        gsap.set(dialog, { visibility: "visible" });
        gsap.to(origin, { opacity: 0, duration: 0.1, ease: "power2.in" }, 0);
      },
      onComplete: () => {
        dialog.style.willChange = "auto";
        gsap.set(dialog, { clearProps: "transform" });
      },
    });

    tl.add(
      Flip.from(originState, {
        targets: dialog,
        duration: 0.5,
        ease: "power2.inOut",
        simple: true,
      }),
      0,
    );

    tl.fromTo(
      dialog,
      { borderRadius: originRadius },
      { borderRadius: targetRadius, duration: 0.75, ease: "power1.in" },
      0,
    );

    tl.fromTo(
      dialog,
      { scaleX: 1, scaleY: 1 },
      { scaleX: 1.05, scaleY: 0.93, duration: 0.16, ease: "power2.out" },
      0,
    );
    tl.to(
      dialog,
      { scaleX: 1, scaleY: 1, duration: 0.45, ease: "elastic.out(1, 0.55)" },
      0.16,
    );
  }

  close(dialogID, event) {
    const dialog = document.getElementById(dialogID);
    if (!dialog || !event) return;

    const originId = dialog.dataset.flipId;
    const origin = document.querySelector(
      `[data-flip-id="${originId}"]:not([open])`
    );

    if (!origin) {
      dialog.setAttribute("style", "");
      dialog.close();
      return;
    }

    const targetRadius = getComputedStyle(origin).borderRadius;
    const originState = Flip.getState(origin);

    const originBg = getComputedStyle(origin).backgroundColor;

    gsap.to(dialog.children, {
      opacity: 0,
      duration: 0.12,
      ease: "power1.in",
    });

    const tl = gsap.timeline({
      defaults: { ease: "power4.inOut" },
      onStart: () => {
        dialog.style.willChange = "width, height, top, left, border-radius, transform, background-color, box-shadow";
      },
      onComplete: () => {
        dialog.close();
        dialog.setAttribute("style", "");
        gsap.set(dialog.children, { opacity: 1 });
        gsap.set(dialog, { opacity: 1, clearProps: "transform" });
      },
    });

    tl.add(
      Flip.to(originState, {
        targets: dialog,
        duration: 0.5,
        ease: "power4.in",
      }),
      0
    );

    tl.to(
      dialog,
      {
        boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
        borderWidth: "0px",
        duration: 0.2,
        ease: "power2.in",
      },
      0
    );

    tl.to(
      dialog,
      {
        backgroundColor: originBg,
        duration: 0.08,
        ease: "power2.in",
      },
      0.22
    );

    tl.to(
      dialog,
      {
        borderRadius: targetRadius,
        duration: 0.1,
        ease: "power2.in",
      },
      0.2
    );

    tl.to(origin, { opacity: 1, duration: 0.01 }, 0.25);
  }
}
