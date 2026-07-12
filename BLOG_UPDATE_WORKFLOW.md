# Blog and social publishing workflow

The former static-file blog workflow is obsolete. Blog articles are created and reviewed through the application’s blog admin flow; publishing an approved article fans out its social derivatives through the social control plane.

See [docs/social-system.md](docs/social-system.md) for the approval gates, publishing operations, worker commands, incident handling, and production ship checklist. See [worker/README.md](worker/README.md) for the content worker’s environment and command reference.
