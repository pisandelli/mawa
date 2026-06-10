# DareDash Checklist

- [ ] The DareDash operational docs was loaded from `ui.docs.source_url` before component/spec/review decisions.
- [ ] DareDash is configured as a Nuxt module when implementation begins.
- [ ] Prefix is documented and used consistently.
- [ ] No internal DareDash imports are used.
- [ ] No invented props, emits, slots, or attrs are used.
- [ ] No generic `variant="primary"` style props are invented.
- [ ] There is only one global `dd-toaster`.
- [ ] `dd-form-*` components are used only with vee-validate context.
- [ ] Layout starts from DareDash primitives where appropriate.
- [ ] CSS overrides come after components, attrs, tokens, and exposed variables.
