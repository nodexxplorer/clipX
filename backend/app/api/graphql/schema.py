# pyright: reportCallIssue=false, reportArgumentType=false, reportGeneralTypeIssues=false, reportReturnType=false
"""
Thin schema aggregator — merges partial Query/Mutation classes from domain modules.

Import path `from app.api.graphql.schema import schema` is preserved so
main.py needs NO changes.
"""

import strawberry
from strawberry.tools import merge_types

# ── Query partials ─────────────────────────────────────────
from app.api.graphql.queries.movies import MovieQueries
from app.api.graphql.queries.user import UserQueries
from app.api.graphql.queries.admin import AdminQueries

# ── Mutation partials ──────────────────────────────────────
from app.api.graphql.mutations.auth import AuthMutations
from app.api.graphql.mutations.user import UserMutations
from app.api.graphql.mutations.social import SocialMutations
from app.api.graphql.mutations.admin import AdminMutations
from app.api.graphql.mutations.subscriptions import SubscriptionMutations

# ── Merge ──────────────────────────────────────────────────
Query = merge_types("Query", (MovieQueries, UserQueries, AdminQueries))
Mutation = merge_types("Mutation", (AuthMutations, UserMutations, SocialMutations, AdminMutations, SubscriptionMutations))

schema = strawberry.Schema(query=Query, mutation=Mutation)
