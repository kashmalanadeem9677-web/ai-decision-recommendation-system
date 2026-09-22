from typing import Any

from app.models.rule_models import Specification, Rule


def evaluate_condition(
    data: dict[str, Any],
    field: str,
    operator: str,
    expected_value: Any
) -> tuple[bool, Any]:
    if field not in data:
        return False, None

    actual_value = data[field]

    try:
        if operator == ">":
            return actual_value > expected_value, actual_value

        if operator == "<":
            return actual_value < expected_value, actual_value

        if operator == ">=":
            return actual_value >= expected_value, actual_value

        if operator == "<=":
            return actual_value <= expected_value, actual_value

        if operator == "==":
            return actual_value == expected_value, actual_value

        if operator == "!=":
            return actual_value != expected_value, actual_value

        if operator == "contains":
            if isinstance(actual_value, (list, str)):
                return expected_value in actual_value, actual_value

            return False, actual_value

        if operator == "in":
            if isinstance(expected_value, list):
                return actual_value in expected_value, actual_value

            return False, actual_value

        if operator == "between":
            if (
                isinstance(expected_value, list)
                and len(expected_value) == 2
            ):
                minimum = expected_value[0]
                maximum = expected_value[1]

                return (
                    minimum <= actual_value <= maximum,
                    actual_value
                )

            return False, actual_value

        if operator == "length_gte":
            if isinstance(actual_value, (list, str, dict)):
                actual_length = len(actual_value)

                return (
                    actual_length >= expected_value,
                    actual_length
                )

            return False, actual_value

        if operator == "length_lte":
            if isinstance(actual_value, (list, str, dict)):
                actual_length = len(actual_value)

                return (
                    actual_length <= expected_value,
                    actual_length
                )

            return False, actual_value

        return False, actual_value

    except (TypeError, ValueError):
        return False, actual_value


def evaluate_rule(
    data: dict[str, Any],
    rule: Rule
) -> tuple[bool, list[dict]]:
    condition_results = []

    for condition in rule.conditions:
        matched, actual_value = evaluate_condition(
            data=data,
            field=condition.field,
            operator=condition.operator,
            expected_value=condition.value
        )

        condition_results.append(
            {
                "field": condition.field,
                "actual_value": actual_value,
                "operator": condition.operator,
                "expected_value": condition.value,
                "matched": matched
            }
        )

    results = [
        condition["matched"]
        for condition in condition_results
    ]

    if rule.logic == "AND":
        rule_matched = all(results)
    elif rule.logic == "OR":
        rule_matched = any(results)
    else:
        rule_matched = False

    return rule_matched, condition_results


def analyze_data(
    data: dict[str, Any],
    specification: Specification
) -> tuple[list[str], list[dict]]:
    flags = []
    rule_results = []

    for rule in specification.rules:
        matched, condition_results = evaluate_rule(
            data=data,
            rule=rule
        )

        rule_results.append(
            {
                "flag": rule.flag,
                "description": rule.description,
                "logic": rule.logic,
                "matched": matched,
                "conditions": condition_results
            }
        )

        if matched:
            flags.append(rule.flag)

    return flags, rule_results