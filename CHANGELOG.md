# Changelog

## [0.8.0](https://github.com/erclx/aitk/compare/v0.7.0...v0.8.0) (2026-08-02)


### Features

* **eval:** retain run output and append a ledger row per run ([#686](https://github.com/erclx/aitk/issues/686)) ([e13c540](https://github.com/erclx/aitk/commit/e13c5409497552dc2918dea5e45256a99f292a65))
* **package:** publish the CLI to the registry as '@erclx/aitk' ([#687](https://github.com/erclx/aitk/issues/687)) ([496ebad](https://github.com/erclx/aitk/commit/496ebad513d0a9e14a3b8a38017b6d4af55cee49))
* **roadmap:** stop drafting when the MVP scope has already shipped ([#684](https://github.com/erclx/aitk/issues/684)) ([6f8f8f8](https://github.com/erclx/aitk/commit/6f8f8f8ca51a55973523afb8a7676b33f35d7764))
* **snippets:** ship the orchestrator resume and sweep runbooks ([#685](https://github.com/erclx/aitk/issues/685)) ([b520764](https://github.com/erclx/aitk/commit/b520764d6c8b095ae83c1ab9f76db0a804742a6d))

## [0.7.0](https://github.com/erclx/aitk/compare/v0.6.0...v0.7.0) (2026-08-01)


### Features

* **diagram:** verify each diagram against its rendered image ([#680](https://github.com/erclx/aitk/issues/680)) ([2cf6387](https://github.com/erclx/aitk/commit/2cf638714c491b4415601aaddc56b6e1159ebe3a))
* **init:** install governance by default and keep the opt-out ([#681](https://github.com/erclx/aitk/issues/681)) ([9fe6f2c](https://github.com/erclx/aitk/commit/9fe6f2cb07845b16f040261f89d35d2866c2d25b))
* **review:** add a close-out pass to the PR review skill ([#682](https://github.com/erclx/aitk/issues/682)) ([accabff](https://github.com/erclx/aitk/commit/accabff9c2dfb5f598b6ed8b0650d0b2ad720da3))

## [0.6.0](https://github.com/erclx/aitk/compare/v0.5.0...v0.6.0) (2026-08-01)


### Features

* **tasks:** close a task from the merge that shipped it ([#676](https://github.com/erclx/aitk/issues/676)) ([b64be89](https://github.com/erclx/aitk/commit/b64be89b4246e25c4d2b4d8445bf3941caef1181))

## [0.5.0](https://github.com/erclx/aitk/compare/v0.4.1...v0.5.0) (2026-08-01)


### Features

* **standards:** define post-MVP scope with lifecycle and distribution ([#675](https://github.com/erclx/aitk/issues/675)) ([0341604](https://github.com/erclx/aitk/commit/03416041fec4fc24fea4b71fc7ed6e4d57528bbd))

## [0.4.1](https://github.com/erclx/aitk/compare/v0.4.0...v0.4.1) (2026-08-01)


### Bug Fixes

* **orchestrate:** stop asserting an active version with no source ([#670](https://github.com/erclx/aitk/issues/670)) ([4b88086](https://github.com/erclx/aitk/commit/4b88086369740a2fe07c19f138c080f7ca3c221d))

## [0.4.0](https://github.com/erclx/aitk/compare/v0.3.1...v0.4.0) (2026-08-01)


### Features

* **eval:** add a seed arm and trim the seed it measured ([#668](https://github.com/erclx/aitk/issues/668)) ([55312d9](https://github.com/erclx/aitk/commit/55312d9d3f1b99f116bcf9f006b279eeb6799ac1))
* **orchestrate:** move orchestration policy into enforcing surfaces ([#666](https://github.com/erclx/aitk/issues/666)) ([b9f538b](https://github.com/erclx/aitk/commit/b9f538bcf0755501eafd48f1d93757f8c98d1f96))
* **sandbox:** report which scenarios declare expectations ([#667](https://github.com/erclx/aitk/issues/667)) ([7136da1](https://github.com/erclx/aitk/commit/7136da1b8a6bebf4a3188ad91eef31fa7a2a4f65))


### Bug Fixes

* **skills:** gate autoship review on a merge base and non-empty diff ([#665](https://github.com/erclx/aitk/issues/665)) ([564d2fb](https://github.com/erclx/aitk/commit/564d2fbae37ed50effaa80e6f6fc9b142ec6a75c))

## [0.3.1](https://github.com/erclx/aitk/compare/v0.3.0...v0.3.1) (2026-08-01)


### Bug Fixes

* **skills:** resolve a cited standard in the plugin root ([#663](https://github.com/erclx/aitk/issues/663)) ([f758f42](https://github.com/erclx/aitk/commit/f758f42fe3389ed6b99b44d042c8aad4e155991c))

## [0.3.0](https://github.com/erclx/aitk/compare/v0.2.0...v0.3.0) (2026-08-01)


### Features

* **standards:** route tooling references and flag banned words ([#658](https://github.com/erclx/aitk/issues/658)) ([0bfcd3c](https://github.com/erclx/aitk/commit/0bfcd3cd13083d304d46a690144b45e7a9f5771b))


### Bug Fixes

* **skills:** resolve the diff baseline against a merge base ([#657](https://github.com/erclx/aitk/issues/657)) ([1991db7](https://github.com/erclx/aitk/commit/1991db799d158a811b1ae49a361d8c77d188314b))

## [0.2.0](https://github.com/erclx/aitk/compare/v0.1.0...v0.2.0) (2026-08-01)


### Features

* **plugin:** publish through a marketplace manifest ([#655](https://github.com/erclx/aitk/issues/655)) ([a63f7df](https://github.com/erclx/aitk/commit/a63f7df70484ebcd8237254e0bfea775b1da5cac))
* **release:** add release automation and manifest validation ([#651](https://github.com/erclx/aitk/issues/651)) ([25a5cd2](https://github.com/erclx/aitk/commit/25a5cd258541626b48bebb960339d2461caf3914))
* **sandbox:** stage the anchor tree from a local fixture ([#652](https://github.com/erclx/aitk/issues/652)) ([0d0f1cc](https://github.com/erclx/aitk/commit/0d0f1ccf581937c68f8bdfb5b682d1afc35a350e))


### Bug Fixes

* **release:** exclude the generated changelog from prettier ([#656](https://github.com/erclx/aitk/issues/656)) ([ccb8e5d](https://github.com/erclx/aitk/commit/ccb8e5d50ed25daf4c349aaede1189d929d830e9))
* **release:** exclude the plugin manifest from prettier ([#654](https://github.com/erclx/aitk/issues/654)) ([d39b504](https://github.com/erclx/aitk/commit/d39b504a82db37332ae4d0725b5771f88415f851))
* **worktree:** repair 'core.bare' after worktree entry sets it ([#650](https://github.com/erclx/aitk/issues/650)) ([f414b54](https://github.com/erclx/aitk/commit/f414b5451a6a1747507c737f5b2410df82bce7c1))
