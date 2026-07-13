# T3 Code Integration

T3 Code starts `opencode serve` directly. Shell aliases are not evaluated, and
a desktop process usually does not inherit variables defined only in
`.bashrc`. Consequently, this works in a terminal but not reliably in T3 Code:

```bash
alias opencode='COMMANDCODE_API_KEY=... opencode'
```

## Recommended Authentication

Store the credential through OpenCode so terminal and server processes share
the same credential store:

1. Start OpenCode in a terminal.
2. Run `/connect`.
3. Select **Command Code** and **API Key**.
4. Paste the key.
5. Fully quit and restart T3 Code.

OpenCode stores the credential in its user data directory. Do not commit the
key, put it in `opencode.json`, or keep it in a shell alias.

## Environment Alternative

If credential-store authentication is not available, launch the T3 Code
AppImage from an environment that exports `COMMANDCODE_API_KEY`:

```bash
export COMMANDCODE_API_KEY="your-key"
./T3-Code.AppImage
```

Setting the variable in `.bashrc` only helps when T3 Code is launched from an
interactive Bash process that sourced that file. A desktop launcher generally
will not source it.

## Diagnostics

Verify the model catalog independently of T3 Code:

```bash
opencode models commandcode
```

If models appear but requests report `Failed to initialize provider:
commandcode`, authentication is missing from the OpenCode server process. If
new models do not appear, update this plugin or ensure the public model-list
endpoint is reachable. Set `COMMANDCODE_DISABLE_MODEL_SYNC=1` only when an
offline startup with the bundled catalog is required.
