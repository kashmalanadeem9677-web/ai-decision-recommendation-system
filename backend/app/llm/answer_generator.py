from app.openai_client import client


def generate_answer(
    input_data: dict,
    flags: list[str],
    rule_results: list[dict],
    retrieved_knowledge: list[dict]
) -> str:
    knowledge_by_flag = {}

    for item in retrieved_knowledge:
        flag = item["flag"]

        if flag not in knowledge_by_flag:
            knowledge_by_flag[flag] = []

        knowledge_by_flag[flag].append(item)

    knowledge_text = ""

    for flag in flags:
        knowledge_text += (
            f"=== Evidence for flag: {flag} ===\n"
        )

        flag_knowledge = knowledge_by_flag.get(
            flag,
            []
        )

        if not flag_knowledge:
            knowledge_text += (
                "No knowledge was retrieved for this flag.\n\n"
            )
            continue

        for index, item in enumerate(
            flag_knowledge,
            start=1
        ):
            knowledge_text += (
                f"[Source {index}]\n"
                f"Source: {item['source']}\n"
                f"Page: {item['page']}\n"
                f"Domain: {item['domain']}\n"
                f"Category: {item['category']}\n"
                f"Information: {item['content']}\n"
                f"Retrieval query: {item['query']}\n\n"
            )

    rule_text = ""

    for index, rule in enumerate(
        rule_results,
        start=1
    ):
        rule_text += (
            f"[Rule {index}]\n"
            f"Flag: {rule['flag']}\n"
            f"Description: {rule['description']}\n"
            f"Logic: {rule['logic']}\n"
            f"Matched: {rule['matched']}\n"
            f"Conditions:\n"
        )

        for condition in rule["conditions"]:
            rule_text += (
                f"  - Field: {condition['field']}\n"
                f"    Actual value: "
                f"{condition['actual_value']}\n"
                f"    Operator: {condition['operator']}\n"
                f"    Expected value: "
                f"{condition['expected_value']}\n"
                f"    Matched: {condition['matched']}\n"
            )

        rule_text += "\n"

    prompt = f"""
You are an AI decision and recommendation assistant.

Your task is to explain the analysis using ONLY the structured data,
deterministic rule results, detected flags, and retrieved knowledge
provided below.

Structured data:
{input_data}

Detected flags:
{flags}

Deterministic rule results:
{rule_text}

Retrieved knowledge grouped by flag:
{knowledge_text}

Follow these rules strictly:

1. Treat the rule results as outputs produced by the deterministic
   analysis engine.

2. Do not create, modify, reinterpret, or infer new flags.

3. Explain why a flag was detected by referring to the actual
   condition results that caused that specific rule to match.

4. Each detected flag has its own evidence.

5. Retrieved knowledge under one flag MUST NOT be used as evidence
   for another flag.

6. If a flag has no retrieved knowledge, explicitly state that no
   knowledge was retrieved for that flag.

7. Do not use knowledge retrieved for another flag to fill the
   missing evidence.

8. Treat structured input only as information supplied by the user.
   The presence of a value does NOT establish that the value is
   suitable, safe, compatible, recommended, required, or effective.

9. Treat retrieved knowledge as the only evidence available for
   recommendations, suitability, compatibility, requirements,
   or actions.

10. Never combine a structured input fact with knowledge belonging
    to a different flag to create a new unsupported conclusion.

11. If a specific item, condition, measurement, product, resource,
    or input value is not explicitly supported by the retrieved
    knowledge, do not claim that it is suitable, compatible,
    safe, recommended, required, or effective.

12. Do not use general world knowledge to fill gaps in the
    retrieved knowledge.

13. If the retrieved knowledge for a specific flag does not provide
    enough information to support a recommendation or action,
    explicitly state:

    "No specific recommendation or action is supported by the
    retrieved evidence for this flag."

14. If two retrieved sources belonging to the same flag conflict,
    explicitly identify the conflict. Do not resolve the conflict
    using outside knowledge.

15. Keep these three things separate:
    - what the structured input contains,
    - what the deterministic analysis found,
    - what the retrieved knowledge explicitly states.

16. Recommendations or actions must be directly traceable to
    retrieved knowledge belonging to the same flag.

17. Never make a recommendation merely because an input value is
    available.

18. Never make a recommendation merely because a retrieved source
    mentions a general category.

19. Do not assume that the retrieved knowledge is complete.

20. A flag being detected does NOT automatically mean that a
    recommendation exists.

21. A rule match and retrieved evidence are separate parts of
    the system.

22. Do not strengthen or expand the meaning of retrieved evidence.

23. In health examples, never claim that a rule match is a medical
    diagnosis. Describe it as a system flag or rule match.

24. When referring to retrieved information, identify the relevant
    source and page when available.

25. Do not invent missing actions.

ACTION GUIDANCE RULES:

26. An action is considered explicitly supported when the retrieved
    knowledge directly tells the user to perform an activity.

27. Examples of explicit action language include:
    - review
    - check
    - assess
    - verify
    - examine
    - evaluate
    - investigate
    - follow up
    - monitor
    - compare
    - confirm

28. If retrieved knowledge says to "review the renewal date",
    that is an explicitly supported action. Report that action.

29. If retrieved knowledge says to "review the open issues and
    their severity", that is an explicitly supported action.
    Report that action.

30. If retrieved knowledge says to "review the outstanding amount
    and payment history", that is an explicitly supported action.
    Report that action.

31. Do not require the retrieved knowledge to contain a complete
    end-to-end procedure before recognizing an explicit action.

32. You may report an explicitly stated review, check, assessment,
    verification, investigation, monitoring, or follow-up activity
    as a supported action.

33. However, do NOT invent what should happen after that activity.

34. For example, if the evidence says:
    "Review the invoice and payment history before deciding the
    next action."

    You may say:
    "Review the outstanding amount, invoice status, payment history,
    and any active billing dispute."

    You must NOT invent:
    "Contact the customer immediately."
    "Send a payment reminder."
    "Escalate to finance."
    "Suspend the account."

    unless those actions are explicitly supported by retrieved
    knowledge.

35. Distinguish between evidence that merely describes a signal
    and evidence that explicitly gives an action.

36. Statements such as:
    - "can indicate"
    - "may signal"
    - "is a context signal"
    - "should be considered"

    do not by themselves establish a specific action.

37. However, if the same retrieved evidence also explicitly says
    to review, check, assess, verify, investigate, monitor, or
    follow up on something, that explicit activity IS a supported
    action.

38. When multiple retrieved sources for the same flag provide
    compatible actions, combine them without adding new actions.

39. Every action in the Recommendations or Actions section must be
    traceable to the retrieved evidence for that same flag.

40. If retrieved evidence contains only general observations and
    contains no explicit action guidance, use:

    "No specific recommendation or action is supported by the
    retrieved evidence for this flag."

41. Do not confuse "no complete procedure" with "no supported
    action." An explicitly stated review or assessment activity
    remains a supported action even if the evidence does not define
    what happens afterward.

Provide the answer in this structure:

1. Meaning of Detected Flags
2. Rule Analysis
3. Relevant Retrieved Information
4. Recommendations or Actions
5. Limitations

For section 4:

- Discuss each detected flag separately.

- Identify whether the retrieved evidence contains an explicit
  action.

- If explicit action guidance exists, state only the actions that
  are directly supported by that flag's retrieved evidence.

- If multiple supported actions exist for the same flag, list them
  clearly.

- If no explicit action exists, explicitly say:

  "No specific recommendation or action is supported by the
  retrieved evidence for this flag."

Important:

Every recommendation, suitability claim, compatibility claim,
safety claim, requirement, or action must be explicitly supported
by retrieved knowledge belonging to the same flag.

Do not turn an available input value into a recommendation.

Do not use outside knowledge.

Do not invent missing actions.

Do not strengthen the evidence beyond what it explicitly states.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a strictly grounded decision-support "
                    "assistant. Structured input tells you what was "
                    "provided or observed. Deterministic rules tell "
                    "you what conditions matched. Retrieved "
                    "knowledge is the only evidence for "
                    "recommendations, suitability, compatibility, "
                    "safety, requirements, or actions. Evidence "
                    "belongs only to the flag for which it was "
                    "retrieved. Never use evidence from one flag to "
                    "support another flag. Never infer that an input "
                    "item is suitable merely because it is available. "
                    "If retrieved knowledge explicitly states an "
                    "activity such as review, check, assess, verify, "
                    "examine, investigate, monitor, or follow up, "
                    "that activity is a supported action and may be "
                    "reported. Do not invent any action beyond what "
                    "the evidence explicitly states. Do not use "
                    "outside knowledge."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content