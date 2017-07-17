# TODO

- Frontend validation in edit and create + display errors
- Topics
  - Go to next topic stage
  - Comments
  - Attachments
  - Proposals + voting, etc. (proposalShaping, decisionMaking, agreement stages)
  - Edit topic (title, why, owner)
  - In circles: prettier list of topics (stage, owner, number of comments, number of attachments)

# TODO elsewhere?
- Contact person should only be allowed to be a member of the group (on edit)
- Update did-api README: some TODOs outdated, circles return procedure texts.
- Maybe the did-api circle response should be updated to return procedure texts in a nicer way:
  - circle.procedure.topic[stage] would be nice to be able to write in here.
  - circle.procedure.role.election and circle.procedure.role.evaluation?
  - should it then be circle.procedure.agreement.evaluation for consistency?
- Should we make topic return the procedure for its current stage (uneditable)?
- In topics, maybe rename `finalProposals` to `proposals`.

## Later

- Support checkboxes in procedures that can be checked off during meetings, or while looking at an item.
- Real nice styling of the includes, yo.
- Markdown previews in edit and create includes.
- Consider doing cool DOM-diffing (see bel) instead of manually binding
- Publish: publish to NPM, then (publish-hook) to a CDN (S3? DigitalOcean Object Store?)
- Make it possible to pass a custom markdown parser on create.
  - Can we build a separate no-md-parser version of the lib for this case, that takes the parser as an arg?
  - I mean the other one could take an arg, too, but bundle marked as a default?
