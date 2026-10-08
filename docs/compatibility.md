# Compatibility

SDK/CLI/initializer: npm `0.1.0-alpha.7`, independently queried from registry on 2026-10-08. Host API 1, manifest 1.0-draft, Node >=22.13.

Desktop QA requires an explicit `AMBLE_HOST_PATH` to a built compatible host. Ordinary installation and build never require private source. QA uses isolated temporary profiles and a fixture model. Source doctor is optional and never a runtime capability negotiation API.

Message actions and authentication require compatible host methods. Conversation hooks and direct forms_resume remain unavailable. Actual tested host hashes and desktop flows are recorded in verification.
