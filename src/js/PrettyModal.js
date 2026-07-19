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

    // radio de origen, leído ANTES de tocar nada
    const originRadius = getComputedStyle(origin).borderRadius;

    const originState = Flip.getState(origin);

    gsap.set(dialog, { clearProps: "all" });
    gsap.set(dialog, { visibility: "hidden", opacity: 1 });
    dialog.showModal();

    // el radio final ya lo define la clase CSS del dialog (0, 16px, full...)
    const targetRadius = getComputedStyle(dialog).borderRadius;

    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      this.close(dialogID, true);
    }, { once: true });

    const tl = gsap.timeline({
      onStart: () => {
        dialog.style.willChange = "width, height, top, left, border-radius, transform";
        gsap.set(dialog, { visibility: "visible" });
        gsap.to(origin, { opacity: 0, duration: 0.2 });
      },
      onComplete: () => {
        dialog.style.willChange = "auto";
        gsap.set(dialog, { clearProps: "transform" });
      },
    });

    // 1) posición y tamaño con Flip (sin scale:true para permitir squash & stretch)
    tl.add(
      Flip.from(originState, {
        targets: dialog,
        duration: 0.7,
        ease: "power3.inOut",
      }),
      0,
    );

    // 2) el radio anima aparte, con SU PROPIO ease -> efecto de gota
    tl.fromTo(
      dialog,
      { borderRadius: originRadius },
      { borderRadius: targetRadius, duration: 0.75, ease: "power1.in" },
      0,
    );

    // 3) squash & stretch: anticipación + rebote elástico
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
      `[data-flip-id="${originId}"]:not([open])`,
    );

    if (!origin) {
      dialog.setAttribute("style", "");
      dialog.close();
      return;
    }

    // radio de destino (el del origen), leído antes de animar
    const targetRadius = getComputedStyle(origin).borderRadius;
    const originState = Flip.getState(origin);

    // fade out content first, like the HTML demo
    gsap.to(dialog.children, { opacity: 0, duration: 0.18, ease: "power1.in" });

    // fade dialog itself so the block disappears quickly during travel
    /* gsap.to(dialog, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      delay: 0.05,
    });
    */
    // fade border, shadow and bg to match origin button
    gsap.to(dialog, {
      boxShadow: "0px 0px 0px 0px rgba(0,0,0,0)",
      borderWidth: "0px",
      backgroundColor: getComputedStyle(origin).backgroundColor,
      duration: 0.15,
      ease: "power2.out",
      delay: 0.05,
    });

    const tl = gsap.timeline({
      delay: 0.05,
      defaults: { duration: 0.3, ease: "power4.inOut" },
      onStart: () => {
        dialog.style.willChange = "width, height, top, left, border-radius, transform";
      },
      onComplete: () => {
        dialog.close();
        dialog.setAttribute("style", "");
        gsap.set(dialog.children, { opacity: 1 });
        gsap.set(dialog, { opacity: 1 });
      },
    });

    // 1) posición y tamaño con Flip
    tl.add(
      Flip.to(originState, {
        targets: dialog,
        duration: 0.3,
        ease: "power4.inOut",
      }),
      0,
    );

    // 2) el radio se anima CON DELAY
    tl.to(
      dialog,
      { borderRadius: targetRadius, duration: 0.2, ease: "power2.out" },
      0.15,
    );

    // 3) el texto del botón reaparece justo cuando la caja aterriza
    tl.to(origin, { opacity: 1, duration: 0.1 }, 0.25);
  }
}
