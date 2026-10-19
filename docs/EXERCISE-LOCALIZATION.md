# Exercise display-name localization

`src/data/exercise-display-names.json` contains a complete English (`en`), Bosnian (`bs`) and German (`de`) display-name object for each of the 778 catalogue IDs. It is a static, entry-by-entry dictionary; no runtime word substitution is required.

English labels start from the supplied English alias. Mixed-language modifiers and non-English source titles are normalized into complete English display labels. Bosnian labels retain supplied Bosnian aliases where applicable; missing labels and English-only qualifiers such as “Machine”, “Narrow Grip” and “TGU” receive authored Bosnian names. German labels are authored display translations. Familiar exercise names and named methods (for example, Burpee, Arnold Press, Pallof Press and Nordic Curl) may remain as customary loan names. Variant distinctions such as grip, equipment, posture, laterality and rehabilitation or warm-up context are preserved.

This work localizes titles only. It does not supply technique instructions, endorse rehabilitation protocols, validate source muscle attribution or establish clinical appropriateness. Ambiguous source labels remain limited to the information in the title; catalogue records and near-duplicates are not merged. Supplied Bosnian aliases may retain source terminology and phrasing. Translations have been reviewed during authoring and checked for complete coverage, but have not had an independent professional linguistic or clinical review.

The original `src/data/exercises.json`, IDs, aliases and provenance remain unchanged. Source SHA-256 checked on 2026-10-19: `A992243931B62348CB3F56281A1BFB49840BC97273BCF7F3D9886BF8286090BA`.

Validation: exact source-ID coverage, 778 entries, exactly three nonempty language values per entry, valid JSON and unchanged source checksum. Catalogue integration and translated search behavior are handled separately.
