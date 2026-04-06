"""
Runner script for batch test case execution.
Receives base64-encoded Python code and a JSON array of inputs,
runs the code once per input in a subprocess, and prints JSON results to stderr.
stdout is reserved for the student's program output (discarded by the runner).
"""
import subprocess
import json
import sys
import base64

MAX_OUTPUT = 10240  # 10KB per test case

def main():
    code = base64.b64decode(sys.argv[1]).decode()
    inputs = json.loads(base64.b64decode(sys.argv[2]).decode())
    timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 5

    with open('/tmp/solution.py', 'w') as f:
        f.write(code)

    results = []
    for inp in inputs:
        try:
            r = subprocess.run(
                ['python3', '/tmp/solution.py'],
                input=inp,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            output = r.stdout[:MAX_OUTPUT] if r.stdout else ''
            results.append({
                'output': output,
                'error': r.stderr[:MAX_OUTPUT] if r.stderr else '',
                'exitCode': r.returncode
            })
        except subprocess.TimeoutExpired as e:
            results.append({
                'output': '',
                'error': f'Tu código tardó más de {timeout} segundos en ejecutarse.',
                'exitCode': -1
            })

    # Write results to stderr so they don't mix with student program output
    print(json.dumps(results), file=sys.stderr)

if __name__ == '__main__':
    main()
