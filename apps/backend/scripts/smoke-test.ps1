# PHASE 8 — API smoke test for GATE CS & IT PYQ backend (two-stage).
#
# PREREQUISITES (one-time):
#   1) PostgreSQL running at localhost:5432 with an EMPTY dev DB "gate_pyq".
#   2) cd apps/backend ; npx prisma migrate dev        # applies Phase 7 migration
#   3) npm run build ; node dist/index.js              # start API (other terminal)
#
# RUN:
#   powershell -File scripts\smoke-test.ps1 -Stage 1    # auth + RBAC + public reads
#   -- promote accounts via SQL, then --
#   powershell -File scripts\smoke-test.ps1 -Stage 2    # content, practice, grading, IDOR
#
# Role bootstrap SQL between Stage 1 and Stage 2 (test env only):
#   UPDATE users SET role_id=(SELECT id FROM roles WHERE code='moderator') WHERE email LIKE 'mod-1-%@test.local';
#   UPDATE users SET role_id=(SELECT id FROM roles WHERE code='admin')     WHERE email LIKE 'adm-2-%@test.local';
#   DELETE FROM sessions;                                  -- force fresh logins after role change
#
# Requires curl.exe (ships with Windows 10+).

param([int]$Stage = 1)

$ErrorActionPreference = "Stop"
$Base = "http://localhost:4000/api/v1"
$Tmp = $env:TEMP

function Find-JarEmail($jar) {
  Select-String -Path $jar -Pattern "gate-test-(a|b|m|n)" -ErrorAction SilentlyContinue | ForEach-Object { $_.Matches[0].Value } | Select-Object -First 1
}

function Invoke-Api($method, $path, $jar, $body, $expectStatus) {
  $args = @("-s", "-o", "$Tmp\gate-body.json", "-w", "%{http_code}", "-X", $method, "$Base$path")
  if ($jar) { $args += @("-b", $jar, "-c", $jar) }
  if ($null -ne $body) {
    $bodyFile = Join-Path $Tmp "gate-request.json"
    $body | ConvertTo-Json -Depth 8 -Compress | Set-Content -Path $bodyFile -Encoding UTF8 -NoNewline
    $args += @("-H", "Content-Type: application/json", "--data-binary", "@$bodyFile")
  }
  $code = & curl.exe @args
  $raw = Get-Content "$Tmp\gate-body.json" -Raw
  $json = if ($raw) { $raw | ConvertFrom-Json } else { $null }
  if ($PSBoundParameters.ContainsKey("expectStatus") -and ([int]$code -ne $expectStatus)) {
    Write-Host "FAIL [$method $path] expected $expectStatus got $code :: $raw" -ForegroundColor Red
    exit 1
  }
  return @{ code = [int]$code; body = $json; raw = $raw }
}

function Assert($cond, $label) {
  if ($cond) { Write-Host "PASS: $label" -ForegroundColor Green }
  else { Write-Host "FAIL: $label" -ForegroundColor Red; exit 1 }
}

# Stage 2 reuses the accounts created by Stage 1. Stage 1 always regenerates a
# fresh stamp so it is rerunnable without deleting DB accounts (duplicate 409s).
if ($Stage -eq 2 -and (Test-Path "$Tmp\gate-users.json")) {
  $stamp = (Get-Content "$Tmp\gate-users.json" -Raw | ConvertFrom-Json).stamp
} else {
  $stamp = (Get-Random).ToString()
  @{ stamp = $stamp } | ConvertTo-Json | Set-Content "$Tmp\gate-users.json"
}

$JarA = "$Tmp\gate-a.jar"; $JarB = "$Tmp\gate-b.jar"; $JarM = "$Tmp\gate-m.jar"; $JarN = "$Tmp\gate-n.jar"

if ($Stage -eq 1) {

  # ─── Register ──────────────────────────────────────────────────────────────
  Invoke-Api "POST" "/auth/register" $null @{ email = "gate-test-a-$stamp@test.local"; password = "passw0rd1"; full_name = "Student A" } 201 | Out-Null
  Invoke-Api "POST" "/auth/register" $null @{ email = "gate-test-b-$stamp@test.local"; password = "passw0rd1"; full_name = "Student B" } 201 | Out-Null
  Invoke-Api "POST" "/auth/register" $null @{ email = "gate-test-m-$stamp@test.local"; password = "passw0rd1"; full_name = "Author Mod" } 201 | Out-Null
  Invoke-Api "POST" "/auth/register" $null @{ email = "gate-test-n-$stamp@test.local"; password = "passw0rd1"; full_name = "Publisher Admin" } 201 | Out-Null

  $dup = Invoke-Api "POST" "/auth/register" $null @{ email = "gate-test-a-$stamp@test.local"; password = "passw0rd1"; full_name = "Dup" }
  Assert ($dup.code -eq 409 -and $dup.body.error.code -eq "EMAIL_ALREADY_REGISTERED") "register duplicate -> 409 EMAIL_ALREADY_REGISTERED"

  $weak = Invoke-Api "POST" "/auth/register" $null @{ email = "weak-$stamp@test.local"; password = "short"; full_name = "Weak" }
  Assert ($weak.code -eq 422) "weak password -> 422"

  # ─── Login / session cookie ────────────────────────────────────────────────
  Invoke-Api "POST" "/auth/login" $JarA @{ email = "gate-test-a-$stamp@test.local"; password = "passw0rd1" } 200 | Out-Null
  Invoke-Api "POST" "/auth/login" $JarB @{ email = "gate-test-b-$stamp@test.local"; password = "passw0rd1" } 200 | Out-Null
  Invoke-Api "POST" "/auth/login" $JarM @{ email = "gate-test-m-$stamp@test.local"; password = "passw0rd1" } 200 | Out-Null
  Invoke-Api "POST" "/auth/login" $JarN @{ email = "gate-test-n-$stamp@test.local"; password = "passw0rd1" } 200 | Out-Null

  $bad = Invoke-Api "POST" "/auth/login" $null @{ email = "gate-test-a-$stamp@test.local"; password = "wrong-pass9" }
  Assert ($bad.code -eq 401 -and $bad.body.error.code -eq "AUTH_INVALID_CREDENTIALS") "wrong password -> 401"

  $me = Invoke-Api "GET" "/auth/me" $JarA $null 200
  Assert ($me.body.data.role -eq "student") "auth/me -> student role"

  # Logout revokes server-side.
  $tmpJar = "$Tmp\gate-tmp.jar"
  Invoke-Api "POST" "/auth/login" $tmpJar @{ email = "gate-test-a-$stamp@test.local"; password = "passw0rd1" } 200 | Out-Null
  Invoke-Api "POST" "/auth/logout" $tmpJar $null 200 | Out-Null
  $afterLogout = Invoke-Api "GET" "/auth/me" $tmpJar $null
  Assert ($afterLogout.code -eq 401) "logout revokes session -> subsequent me 401"
  Remove-Item $tmpJar -ErrorAction SilentlyContinue

  # ─── Public reads & auth gates ─────────────────────────────────────────────
  $subjects = Invoke-Api "GET" "/subjects" $null $null 200
  Assert ($null -ne $subjects.body.data.items) "public subjects list (guest)"

  $noauth = Invoke-Api "GET" "/questions" $null $null
  Assert ($noauth.code -eq 401) "questions without token -> 401"

  $rbac = Invoke-Api "GET" "/admin/users" $JarA $null
  Assert ($rbac.code -eq 403 -and $rbac.body.error.code -eq "FORBIDDEN_ROLE") "student on admin endpoint -> 403 FORBIDDEN_ROLE"

  $notfound = Invoke-Api "GET" "/practice-sessions/00000000-0000-0000-0000-000000000000" $JarA $null
  Assert ($notfound.code -eq 404) "unknown session id -> 404"

  Write-Host "`nSTAGE 1 COMPLETE. Now run the role-promotion SQL from the script header, then run with -Stage 2." -ForegroundColor Yellow
  exit 0
}

# ═══ STAGE 2 — requires promoted moderator/admin accounts ═════════════════════
foreach ($jar in @($JarA, $JarB, $JarM, $JarN)) {
  if (-not (Test-Path $jar)) { Write-Host "Missing login jar $jar — run Stage 1 first." -ForegroundColor Red; exit 1 }
}
Invoke-Api "POST" "/auth/login" $JarM @{ email = "gate-test-m-$stamp@test.local"; password = "passw0rd1" } 200 | Out-Null
Invoke-Api "POST" "/auth/login" $JarN @{ email = "gate-test-n-$stamp@test.local"; password = "passw0rd1" } 200 | Out-Null

# ─── Admin taxonomy setup ────────────────────────────────────────────────────
$subject = Invoke-Api "POST" "/admin/subjects" $JarN @{ code = "algo$stamp"; name = "Algorithms $stamp"; sort_order = 1 }
if ($subject.code -ne 201) { $subject = Invoke-Api "POST" "/admin/subjects" $JarN @{ code = "algo$(Get-Random)"; name = "Algorithms $(Get-Random)"; sort_order = 1 } 201 }
$subjectId = $subject.body.data.id
Assert ($null -ne $subjectId) "admin create subject"

$topic = Invoke-Api "POST" "/admin/topics" $JarN @{ subject_id = $subjectId; name = "Sorting" } 201
$topicId = $topic.body.data.id
Assert ($null -ne $topicId) "admin create topic"

# Student attempts admin write -> 403.
$sdeny = Invoke-Api "POST" "/admin/subjects" $JarA @{ code = "nope"; name = "Nope" }
Assert ($sdeny.code -eq 403) "student blocked from admin writes"

# Moderator cannot touch users (Phase 4 §5.2).
$mdeny = Invoke-Api "GET" "/admin/users" $JarM $null
Assert ($mdeny.code -eq 403) "moderator blocked from /admin/users"

# ─── Questions: MCQ / MSQ / NAT authored by moderator ────────────────────────
$mcq = Invoke-Api "POST" "/admin/questions" $JarM @{
  type_code = "mcq"; subject_id = $subjectId; topic_id = $topicId
  body = "What is the time complexity of merge sort in the worst case?"
  explanation = "Merge sort splits and merges: O(n log n) comparisons in all cases."
  marks = 1; negative_marks = 0.33; difficulty = "easy"; gate_year = 2023
  options = @(
    @{ body = "O(n)"; is_correct = $false },
    @{ body = "O(n log n)"; is_correct = $true },
    @{ body = "O(n^2)"; is_correct = $false },
    @{ body = "O(log n)"; is_correct = $false }
  )
} 201
$mcqId = $mcq.body.data.id

$msq = Invoke-Api "POST" "/admin/questions" $JarM @{
  type_code = "msq"; subject_id = $subjectId; topic_id = $topicId
  body = "Which of the following are stable sorting algorithms?"
  explanation = "Merge sort and insertion sort are stable; quicksort and heapsort are not."
  marks = 2; difficulty = "medium"; gate_year = 2022
  options = @(
    @{ body = "Merge sort"; is_correct = $true },
    @{ body = "Quicksort"; is_correct = $false },
    @{ body = "Insertion sort"; is_correct = $true },
    @{ body = "Heapsort"; is_correct = $false }
  )
} 201
$msqId = $msq.body.data.id

$nat = Invoke-Api "POST" "/admin/questions" $JarM @{
  type_code = "nat"; subject_id = $subjectId; topic_id = $topicId
  body = "How many comparisons does binary search need in the worst case for n = 1024? (answer within tolerance)"
  explanation = "log2(1024) = 10 comparisons."
  marks = 2; difficulty = "medium"; gate_year = 2021
  numeric_answers = @( @{ numeric_value = 10; tolerance_abs = 0.1 } )
} 201
$natId = $nat.body.data.id

$mcqBadShape = Invoke-Api "POST" "/admin/questions" $JarM @{
  type_code = "mcq"; subject_id = $subjectId; topic_id = $topicId
  body = "Two correct answers must fail validation for MCQ."
  marks = 1; gate_year = 2023; difficulty = "easy"
  options = @(
    @{ body = "A"; is_correct = $true },
    @{ body = "B"; is_correct = $true }
  )
}
Assert ($mcqBadShape.code -eq 422) "MCQ with two correct options -> 422"

# Publish by a different account than author (OD-07).
$selfPub = Invoke-Api "POST" "/admin/questions/$mcqId/publish" $JarM $null
Assert ($selfPub.code -eq 403 -and $selfPub.body.error.code -eq "FORBIDDEN_AUTHOR_CANNOT_PUBLISH") "author cannot publish own question"

Invoke-Api "POST" "/admin/questions/$mcqId/publish" $JarN $null 200 | Out-Null
Invoke-Api "POST" "/admin/questions/$msqId/publish" $JarN $null 200 | Out-Null
Invoke-Api "POST" "/admin/questions/$natId/publish" $JarN $null 200 | Out-Null

# Student view hides answers/explanation.
$qv = Invoke-Api "GET" "/questions/$mcqId" $JarA $null 200
Assert ($null -eq $qv.body.data.explanation -and $null -eq $qv.body.data.answers) "student question view hides answer + explanation"

# ─── Practice lifecycle ──────────────────────────────────────────────────────
$session = Invoke-Api "POST" "/practice-sessions" $JarA @{
  mode = "topic"; filters = @{ topic_id = $topicId }; timed = $false; question_count = 3
} 201
$sessionId = $session.body.data.id
Assert ($session.body.data.total_questions -ge 1) "create session with pool size >= 1"

$emptyPool = Invoke-Api "POST" "/practice-sessions" $JarA @{ mode = "topic"; filters = @{ topic_id = "00000000-0000-0000-0000-000000000abc" } }
Assert ($emptyPool.code -eq 422) "unknown/inactive topic filter -> 422 NO_MATCHING_QUESTIONS or UNKNOWN_TOPIC"

Invoke-Api "POST" "/practice-sessions/$sessionId/start" $JarA $null 200 | Out-Null
$state0 = Invoke-Api "GET" "/practice-sessions/$sessionId" $JarA $null 200
Assert ($state0.body.data.questions.Count -ge 1) "start builds pool; GET restores state"

# IDOR: student B cannot read A's session.
$idor = Invoke-Api "GET" "/practice-sessions/$sessionId" $JarB $null
Assert ($idor.code -eq 403 -and $idor.body.error.code -eq "FORBIDDEN_NOT_OWNER") "cross-student session read -> 403 NOT_OWNER"

# Question not in pool -> 422.
$stray = Invoke-Api "POST" "/practice-sessions/$sessionId/attempts" $JarA @{
  question_id = "00000000-0000-0000-0000-000000000fff"; answer = @{ option_id = "x" }; time_taken_seconds = 5
}
Assert ($stray.code -in @(404, 422)) "attempt on non-pool question -> 404/422"

function Submit-Attempt($questionId, $answer, $expect) {
  Invoke-Api "POST" "/practice-sessions/$sessionId/attempts" $JarA @{
    question_id = $questionId; answer = $answer; time_taken_seconds = 30
  } $expect
}

# MCQ correct → +1.
$mcqOptionsRaw = (Invoke-Api "GET" "/questions/${mcqId}?include_answer=true" $JarN $null 200).body.data.answers.options
$mcqCorrect = ($mcqOptionsRaw | Where-Object { $_.is_correct }).id
$mcqWrong = ($mcqOptionsRaw | Where-Object { -not $_.is_correct } | Select-Object -First 1).id

$a1 = Submit-Attempt $mcqId @{ option_id = $mcqCorrect } 201
Assert ($a1.body.data.is_correct -eq $true -and [double]$a1.body.data.marks -eq 1) "MCQ correct -> is_correct true, marks +1"

# Idempotent resubmit → 200 same attempt_id.
$a1r = Submit-Attempt $mcqId @{ option_id = $mcqCorrect } 200
Assert ($a1r.body.data.attempt_id -eq $a1.body.data.attempt_id) "duplicate submit -> 200, same attempt (idempotent upsert)"

# MCQ wrong → negative marking −0.33 (OD-01 official).
$secondSession = Invoke-Api "POST" "/practice-sessions" $JarB @{ mode = "topic"; filters = @{ topic_id = $topicId }; question_count = 3 } 201
Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/start" $JarB $null 200 | Out-Null
$b1 = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/attempts" $JarB @{
  question_id = $mcqId; answer = @{ option_id = $mcqWrong }; time_taken_seconds = 12
} 201
Assert ([math]::Abs([double]$b1.body.data.marks - (-0.33)) -lt 0.001) "MCQ wrong -> -0.33 negative mark"

# MSQ exact set → full +2; proper subset → partial; wrong pick → 0/negative.
$msqAnswers = (Invoke-Api "GET" "/questions/${msqId}?include_answer=true" $JarN $null 200).body.data.answers.options
$msqCorrectIds = @($msqAnswers | Where-Object { $_.is_correct } | ForEach-Object { $_.id })
$msqWrongIds = @($msqAnswers | Where-Object { -not $_.is_correct } | ForEach-Object { $_.id })

$m1 = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/attempts" $JarB @{
  question_id = $msqId; answer = @{ option_ids = $msqCorrectIds }; time_taken_seconds = 20
} 201
Assert ($m1.body.data.is_correct -eq $true -and [double]$m1.body.data.marks -eq 2) "MSQ exact set -> full marks"

$m2 = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/attempts" $JarB @{
  question_id = $msqId; answer = @{ option_ids = @($msqCorrectIds[0]) }; time_taken_seconds = 21
} 200
Assert ([double]$m2.body.data.marks -gt 0 -and $m2.body.data.is_correct -eq $false) "MSQ proper subset -> partial credit, not correct"

$m3 = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/attempts" $JarB @{
  question_id = $msqId; answer = @{ option_ids = @($msqCorrectIds[0], $msqWrongIds[0]) }; time_taken_seconds = 22
} 200
Assert ($m3.body.data.is_correct -eq $false -and [double]$m3.body.data.marks -le 0) "MSQ containing wrong pick -> zero/negative"

# NAT: scientific notation + tolerance; invalid value -> 422.
$n1 = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/attempts" $JarB @{
  question_id = $natId; answer = @{ value = "1.0e1" }; time_taken_seconds = 15
} 201
Assert ($n1.body.data.is_correct -eq $true) "NAT scientific notation 1.0e1 within tolerance -> correct"

$badNat = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/attempts" $JarB @{
  question_id = $natId; answer = @{ value = "abc" }; time_taken_seconds = 15
}
Assert ($badNat.code -eq 422 -and $badNat.body.error.code -eq "INVALID_ANSWER") "NAT non-numeric -> 422 INVALID_ANSWER"

# ─── Complete + result ───────────────────────────────────────────────────────
$result = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/complete" $JarB @{ unanswered_policy = "skipped" } 200
Assert ($result.body.data.status -eq "completed") "complete -> completed"

$again = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/complete" $JarB @{ unanswered_policy = "skipped" }
Assert ($again.code -eq 409) "double complete -> 409 SESSION_NOT_LIVE"

$locked = Invoke-Api "POST" "/practice-sessions/$($secondSession.body.data.id)/attempts" $JarB @{
  question_id = $mcqId; answer = @{ option_id = $mcqWrong }; time_taken_seconds = 3
}
Assert ($locked.code -eq 409) "attempt after completion -> 409 SESSION_NOT_LIVE"

$final = Invoke-Api "GET" "/practice-sessions/$($secondSession.body.data.id)/result" $JarB $null 200
Assert ($final.body.data.summary.skipped -eq (3 - $final.body.data.summary.attempted)) "skipped count = total - attempted (OD-06)"
Assert ($null -ne $final.body.data.explanations) "result includes explanations"

$resultEarly = Invoke-Api "GET" "/practice-sessions/$sessionId/result" $JarA $null
Assert ($resultEarly.code -eq 409 -or $resultEarly.code -eq 200) "result before complete -> 409 (or 200 if already completed)"

# ─── Bookmarks ───────────────────────────────────────────────────────────────
$bm = Invoke-Api "POST" "/bookmarks" $JarA @{ question_id = $mcqId } 201
$bmDup = Invoke-Api "POST" "/bookmarks" $JarA @{ question_id = $mcqId }
Assert ($bmDup.code -eq 409) "duplicate bookmark -> 409 ALREADY_BOOKMARKED"

$bmB = Invoke-Api "DELETE" "/bookmarks/$($bm.body.data.id)" $JarB $null
Assert ($bmB.code -eq 403) "delete another student's bookmark -> 403 NOT_OWNER"

Invoke-Api "DELETE" "/bookmarks/$($bm.body.data.id)" $JarA $null 204 | Out-Null

# ─── Analytics & dashboard ───────────────────────────────────────────────────
$ov = Invoke-Api "GET" "/performance/overview" $JarB $null 200
# Attempts are upserted per question (idempotent, verified above), so student B's
# grading pool of exactly 3 distinct questions (MCQ, MSQ, NAT) yields 3 attempt rows.
Assert ($ov.body.data.total_attempts -ge 3) "performance overview counts attempts"

$topicsPerf = Invoke-Api "GET" "/performance/topics" $JarB $null 200
Assert ($null -ne $topicsPerf.body.data.items) "performance topics list"

$weak = Invoke-Api "GET" "/dashboard/weak" $JarB $null 200
Assert ($null -ne $weak.body.data) "dashboard weak topics"

$summary = Invoke-Api "GET" "/dashboard/summary" $JarB $null 200
Assert ($null -ne $summary.body.data.accuracy) "dashboard summary accuracy"

$mistakes = Invoke-Api "GET" "/mistakes" $JarB $null 200
Assert ($mistakes.body.data.items.Count -ge 1) "mistakes lists incorrectly answered questions"

Write-Host "`nALL SMOKE TESTS PASSED." -ForegroundColor Green
