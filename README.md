# TODO

- Validation in edit and create
- Contact person should only be allowed to be a member of the group (on edit)

- Topics

## Later

- Support checkboxes in procedures that can be checked off during meetings, or while looking at an item.
- Real nice styling of the includes, yo.
- Markdown previews in edit and create includes.
- Consider doing cool DOM-diffing (see bel) instead of manually binding
- Publish: publish to NPM, then (publish-hook) to a CDN (S3? DigitalOcean Object Store?)
- Make it possible to pass a custom markdown parser on create.
  - Can we build a separate no-md-parser version of the lib for this case, that takes the parser as an arg?
  - I mean the other one could take an arg, too, but bundle marked as a default?
