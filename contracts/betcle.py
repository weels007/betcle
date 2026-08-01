# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json


def _addr(a) -> str:
    return str(a).lower()


class BetcleContract(gl.Contract):
    # === Prediction Storage ===
    prediction_question: TreeMap[str, str]
    prediction_category: TreeMap[str, str]
    prediction_resolution_url: TreeMap[str, str]
    prediction_deadline: TreeMap[str, u256]
    prediction_creator: TreeMap[str, str]
    prediction_resolved: TreeMap[str, bool]
    prediction_result: TreeMap[str, str]
    prediction_analysis: TreeMap[str, str]
    prediction_total_yes: TreeMap[str, u256]
    prediction_total_no: TreeMap[str, u256]
    prediction_total_bets: TreeMap[str, u256]

    # === Bet Storage ===
    bet_amount: TreeMap[str, u256]
    bet_choice: TreeMap[str, str]
    bet_claimed: TreeMap[str, bool]
    bet_prediction: TreeMap[str, str]
    bet_bettor: TreeMap[str, str]
    user_bet_count: TreeMap[str, u256]
    user_bet_flat: TreeMap[str, str]
    next_bet_id: u256

    # === User Storage ===
    user_registered: TreeMap[str, bool]
    user_name: TreeMap[str, str]
    user_balance: TreeMap[str, u256]
    user_total_won: TreeMap[str, u256]
    user_total_lost: TreeMap[str, u256]
    user_predictions_created: TreeMap[str, u256]
    user_correct_bets: TreeMap[str, u256]
    user_total_bets: TreeMap[str, u256]

    # === Leaderboard Storage ===
    leaderboard_address: TreeMap[str, str]
    leaderboard_name: TreeMap[str, str]
    leaderboard_winnings: TreeMap[str, u256]
    leaderboard_accuracy: TreeMap[str, u256]
    leaderboard_count: u256

    # === Global Stats ===
    total_predictions: u256
    total_bets: u256
    total_users: u256
    platform_fee_percent: u256
    platform_fee_balance: u256
    admin: str

    # === Categories ===
    category_list: TreeMap[str, str]
    category_count: u256

    def __init__(self):
        self.total_predictions = u256(0)
        self.total_bets = u256(0)
        self.total_users = u256(0)
        self.platform_fee_percent = u256(2)
        self.platform_fee_balance = u256(0)
        self.admin = _addr(gl.message.sender_address)
        self.leaderboard_count = u256(0)
        self.next_bet_id = u256(0)
        self.category_count = u256(7)
        self.category_list["0"] = "crypto"
        self.category_list["1"] = "sports"
        self.category_list["2"] = "politics"
        self.category_list["3"] = "entertainment"
        self.category_list["4"] = "tech"
        self.category_list["5"] = "science"
        self.category_list["6"] = "other"

    # ================================================================
    # USER METHODS
    # ================================================================

    @gl.public.write
    def register(self, name: str) -> str:
        s = _addr(gl.message.sender_address)
        if s in self.user_registered:
            return "already registered"
        self.user_registered[s] = True
        self.user_name[s] = name
        self.user_balance[s] = u256(0)
        self.user_total_won[s] = u256(0)
        self.user_total_lost[s] = u256(0)
        self.user_predictions_created[s] = u256(0)
        self.user_correct_bets[s] = u256(0)
        self.user_total_bets[s] = u256(0)
        self.total_users += u256(1)
        return "registered:" + name

    # ================================================================
    # PREDICTION METHODS
    # ================================================================

    @gl.public.write
    def create_prediction(
        self, question: str, category: str, resolution_url: str, deadline: u256
    ) -> str:
        s = _addr(gl.message.sender_address)
        if not self.user_registered.get(s, False):
            return "not registered"

        pred_id = str(self.total_predictions)
        self.prediction_question[pred_id] = question
        self.prediction_category[pred_id] = category
        self.prediction_resolution_url[pred_id] = resolution_url
        self.prediction_deadline[pred_id] = deadline
        self.prediction_creator[pred_id] = s
        self.prediction_resolved[pred_id] = False
        self.prediction_result[pred_id] = ""
        self.prediction_analysis[pred_id] = ""
        self.prediction_total_yes[pred_id] = u256(0)
        self.prediction_total_no[pred_id] = u256(0)
        self.prediction_total_bets[pred_id] = u256(0)

        self.total_predictions += u256(1)
        self.user_predictions_created[s] = (
            self.user_predictions_created.get(s, u256(0)) + u256(1)
        )

        return pred_id

    @gl.public.write.payable
    def place_bet(self, prediction_id: str, choice: str) -> str:
        s = _addr(gl.message.sender_address)
        if not self.user_registered.get(s, False):
            return "not registered"
        if self.prediction_resolved.get(prediction_id, True):
            return "already resolved"
        if choice not in ("yes", "no"):
            return "invalid choice"

        amount = gl.message.value
        if amount == u256(0):
            raise gl.vm.UserError("must send GEN")

        bet_id = str(self.next_bet_id)
        self.bet_amount[bet_id] = amount
        self.bet_choice[bet_id] = choice
        self.bet_claimed[bet_id] = False
        self.bet_prediction[bet_id] = prediction_id
        self.bet_bettor[bet_id] = s

        bet_idx = self.user_bet_count.get(s, u256(0))
        flat_key = s + ":" + str(bet_idx)
        self.user_bet_flat[flat_key] = bet_id
        self.user_bet_count[s] = bet_idx + u256(1)

        if choice == "yes":
            self.prediction_total_yes[prediction_id] = (
                self.prediction_total_yes.get(prediction_id, u256(0)) + amount
            )
        else:
            self.prediction_total_no[prediction_id] = (
                self.prediction_total_no.get(prediction_id, u256(0)) + amount
            )

        self.prediction_total_bets[prediction_id] = (
            self.prediction_total_bets.get(prediction_id, u256(0)) + amount
        )
        self.total_bets += u256(1)
        self.user_total_bets[s] = self.user_total_bets.get(s, u256(0)) + u256(1)
        self.next_bet_id += u256(1)

        return bet_id

    @gl.public.write
    def resolve_prediction(self, prediction_id: str) -> str:
        if self.prediction_resolved.get(prediction_id, True):
            return "already resolved"

        resolution_url = self.prediction_resolution_url[prediction_id]
        question = self.prediction_question[prediction_id]

        def leader_fn():
            response = gl.nondet.web.request(resolution_url, method="GET")
            web_data = response.body.decode("utf-8")

            prompt = f"""Analyze this prediction and determine the outcome.
Prediction: {question}
Web data source: {resolution_url}
Page content: {web_data}

Determine if the prediction is correct (yes) or incorrect (no).
Return JSON with these exact keys:
{{"analysis": "your detailed reasoning", "answer": "yes" or "no"}}"""

            result = gl.nondet.exec_prompt(prompt, response_format="json")

            if not isinstance(result, dict):
                raise gl.UserError(f"LLM returned non-dict: {type(result)}")

            if result.get("answer") not in ("yes", "no"):
                raise gl.UserError(f"Invalid answer: {result.get('answer')}")

            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False

            try:
                validator_data = leader_fn()
            except Exception:
                return False

            leader_data = leader_result.calldata

            if not isinstance(leader_data, dict) or not isinstance(
                validator_data, dict
            ):
                return False

            return leader_data.get("answer") == validator_data.get("answer")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.prediction_resolved[prediction_id] = True
        self.prediction_result[prediction_id] = result["answer"]
        self.prediction_analysis[prediction_id] = result.get("analysis", "")

        return json.dumps(
            {"resolved": True, "result": result["answer"], "analysis": result.get("analysis", "")}
        )

    @gl.public.write
    def instant_resolve(self, prediction_id: str) -> str:
        if self.prediction_resolved.get(prediction_id, True):
            return "already resolved"

        total_bets = self.prediction_total_bets.get(prediction_id, u256(0))
        if total_bets == u256(0):
            raise gl.vm.UserError("no bets placed yet")

        resolution_url = self.prediction_resolution_url[prediction_id]
        question = self.prediction_question[prediction_id]

        def leader_fn():
            response = gl.nondet.web.request(resolution_url, method="GET")
            web_data = response.body.decode("utf-8")

            prompt = f"""Analyze this prediction and determine the outcome.
Prediction: {question}
Web data source: {resolution_url}
Page content: {web_data}

Determine if the prediction is correct (yes) or incorrect (no).
Return JSON with these exact keys:
{{"analysis": "your detailed reasoning", "answer": "yes" or "no"}}"""

            result = gl.nondet.exec_prompt(prompt, response_format="json")

            if not isinstance(result, dict):
                raise gl.UserError(f"LLM returned non-dict: {type(result)}")

            if result.get("answer") not in ("yes", "no"):
                raise gl.UserError(f"Invalid answer: {result.get('answer')}")

            return result

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False

            try:
                validator_data = leader_fn()
            except Exception:
                return False

            leader_data = leader_result.calldata

            if not isinstance(leader_data, dict) or not isinstance(
                validator_data, dict
            ):
                return False

            return leader_data.get("answer") == validator_data.get("answer")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        self.prediction_resolved[prediction_id] = True
        self.prediction_result[prediction_id] = result["answer"]
        self.prediction_analysis[prediction_id] = result.get("analysis", "")

        return json.dumps(
            {"resolved": True, "result": result["answer"], "analysis": result.get("analysis", "")}
        )

    @gl.public.write
    def claim_rewards(self, prediction_id: str) -> str:
        s = _addr(gl.message.sender_address)
        if not self.prediction_resolved.get(prediction_id, False):
            return "not resolved"

        result = self.prediction_result[prediction_id]
        total_pool = self.prediction_total_bets.get(prediction_id, u256(0))
        winning_pool = (
            self.prediction_total_yes.get(prediction_id, u256(0))
            if result == "yes"
            else self.prediction_total_no.get(prediction_id, u256(0))
        )

        if winning_pool == u256(0):
            return "no winning pool"

        fee = (total_pool * self.platform_fee_percent) // u256(100)
        prize_pool = total_pool - fee

        # Collect platform fee
        self.platform_fee_balance = self.platform_fee_balance + fee

        bet_count = int(self.user_bet_count.get(s, u256(0)))
        total_winnings = u256(0)

        for i in range(bet_count):
            flat_key = s + ":" + str(i)
            bet_id = self.user_bet_flat.get(flat_key, "")
            if not bet_id:
                continue
            if self.bet_claimed.get(bet_id, True):
                continue
            if self.bet_prediction.get(bet_id, "") != prediction_id:
                continue
            if self.bet_choice.get(bet_id, "") != result:
                continue

            bet_amount = self.bet_amount.get(bet_id, u256(0))
            winnings = (bet_amount * prize_pool) // winning_pool
            total_winnings += winnings
            self.bet_claimed[bet_id] = True

        if total_winnings == u256(0):
            return "no winnings to claim"

        self.user_balance[s] = self.user_balance.get(s, u256(0)) + total_winnings
        self.user_total_won[s] = self.user_total_won.get(s, u256(0)) + total_winnings
        self.user_correct_bets[s] = (
            self.user_correct_bets.get(s, u256(0)) + u256(1)
        )

        return json.dumps({"winnings": str(total_winnings)})

    @gl.public.write
    def withdraw(self, amount: u256) -> str:
        s = _addr(gl.message.sender_address)
        balance = self.user_balance.get(s, u256(0))

        if amount == u256(0):
            raise gl.vm.UserError("amount must be greater than 0")
        if amount > balance:
            raise gl.UserError("insufficient balance")

        self.user_balance[s] = balance - amount

        @gl.evm.contract_interface
        class _Recipient:
            class View:
                pass

            class Write:
                pass

        _Recipient(Address(str(gl.message.sender_address))).emit_transfer(value=u256(amount))

        return json.dumps({"withdrawn": str(amount)})

    @gl.public.write
    def withdraw_fee(self, amount: u256) -> str:
        s = _addr(gl.message.sender_address)
        if s != self.admin:
            raise gl.vm.UserError("only admin can withdraw fees")

        if amount == u256(0):
            raise gl.vm.UserError("amount must be greater than 0")
        if amount > self.platform_fee_balance:
            raise gl.vm.UserError("insufficient fee balance")

        self.platform_fee_balance = self.platform_fee_balance - amount

        @gl.evm.contract_interface
        class _FeeRecipient:
            class View:
                pass
            class Write:
                pass

        _FeeRecipient(Address(str(gl.message.sender_address))).emit_transfer(value=u256(amount))

        return json.dumps({"withdrawn_fee": str(amount)})

    # ================================================================
    # VIEW METHODS
    # ================================================================

    @gl.public.view
    def get_prediction(self, prediction_id: str) -> str:
        return json.dumps(
            {
                "id": prediction_id,
                "question": self.prediction_question.get(prediction_id, ""),
                "category": self.prediction_category.get(prediction_id, ""),
                "resolution_url": self.prediction_resolution_url.get(prediction_id, ""),
                "deadline": str(self.prediction_deadline.get(prediction_id, u256(0))),
                "creator": self.prediction_creator.get(prediction_id, ""),
                "resolved": self.prediction_resolved.get(prediction_id, False),
                "result": self.prediction_result.get(prediction_id, ""),
                "analysis": self.prediction_analysis.get(prediction_id, ""),
                "total_yes": str(self.prediction_total_yes.get(prediction_id, u256(0))),
                "total_no": str(self.prediction_total_no.get(prediction_id, u256(0))),
                "total_bets": str(
                    self.prediction_total_bets.get(prediction_id, u256(0))
                ),
            }
        )

    @gl.public.view
    def get_user_info(self, address: str) -> str:
        a = address.lower()
        if not self.user_registered.get(a, False):
            return "not found"
        return json.dumps(
            {
                "name": self.user_name.get(a, ""),
                "balance": str(self.user_balance.get(a, u256(0))),
                "total_won": str(self.user_total_won.get(a, u256(0))),
                "total_lost": str(self.user_total_lost.get(a, u256(0))),
                "predictions_created": str(
                    self.user_predictions_created.get(a, u256(0))
                ),
                "correct_bets": str(self.user_correct_bets.get(a, u256(0))),
                "total_bets": str(self.user_total_bets.get(a, u256(0))),
            }
        )

    @gl.public.view
    def get_user_balance(self, address: str) -> u256:
        return self.user_balance.get(address.lower(), u256(0))

    @gl.public.view
    def get_user_bets(self, address: str) -> str:
        a = address.lower()
        bet_count = int(self.user_bet_count.get(a, u256(0)))
        bets = []
        for i in range(bet_count):
            flat_key = a + ":" + str(i)
            bet_id = self.user_bet_flat.get(flat_key, "")
            if not bet_id:
                continue
            bets.append(
                {
                    "id": bet_id,
                    "prediction_id": self.bet_prediction.get(bet_id, ""),
                    "amount": str(self.bet_amount.get(bet_id, u256(0))),
                    "choice": self.bet_choice.get(bet_id, ""),
                    "claimed": self.bet_claimed.get(bet_id, False),
                }
            )
        return json.dumps(bets)

    @gl.public.view
    def get_leaderboard(self) -> str:
        count = int(self.leaderboard_count)
        entries = []
        for i in range(count):
            idx = str(i)
            addr = self.leaderboard_address.get(idx, "")
            if addr:
                entries.append(
                    {
                        "name": self.leaderboard_name.get(idx, ""),
                        "winnings": str(self.leaderboard_winnings.get(idx, u256(0))),
                        "accuracy": str(
                            self.leaderboard_accuracy.get(idx, u256(0))
                        ),
                        "address": addr[:10] + "...",
                    }
                )
        entries.sort(key=lambda x: int(x.get("winnings", "0")), reverse=True)
        return json.dumps(entries[:20])

    @gl.public.view
    def get_total_predictions(self) -> u256:
        return self.total_predictions

    @gl.public.view
    def get_total_bets(self) -> u256:
        return self.total_bets

    @gl.public.view
    def get_total_users(self) -> u256:
        return self.total_users

    @gl.public.view
    def get_categories(self) -> str:
        count = int(self.category_count)
        cats = []
        for i in range(count):
            cat = self.category_list.get(str(i), "")
            if cat:
                cats.append(cat)
        return json.dumps(cats)

    @gl.public.view
    def get_platform_fee(self) -> u256:
        return self.platform_fee_percent

    @gl.public.write
    def update_leaderboard(self, address: str) -> str:
        s = _addr(gl.message.sender_address)
        if not self.user_registered.get(s, False):
            return "not registered"

        total_won = int(self.user_total_won.get(s, u256(0)))
        total_bets = int(self.user_total_bets.get(s, u256(0)))
        correct = int(self.user_correct_bets.get(s, u256(0)))

        if total_bets == 0:
            return "no bets placed"

        accuracy = (correct * u256(100)) / total_bets

        existing_idx = self.leaderboard_address.get(s, "")
        if existing_idx:
            old_winnings = int(self.leaderboard_winnings.get(existing_idx, u256(0)))
            if total_won > old_winnings:
                self.leaderboard_winnings[existing_idx] = u256(total_won)
                self.leaderboard_accuracy[existing_idx] = accuracy
        else:
            count = int(self.leaderboard_count)
            self.leaderboard_address[str(count)] = s
            self.leaderboard_name[str(count)] = self.user_name.get(s, "unknown")
            self.leaderboard_winnings[str(count)] = u256(total_won)
            self.leaderboard_accuracy[str(count)] = accuracy
            self.leaderboard_count = u256(count + 1)

        return "leaderboard updated"

    @gl.public.view
    def get_platform_fee_balance(self) -> u256:
        return self.platform_fee_balance

    @gl.public.view
    def get_admin(self) -> str:
        return self.admin
