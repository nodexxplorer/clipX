import os
folder = r'c:\Users\Fortune\Desktop\ideas\clipX\mobile'
for root, _, files in os.walk(folder):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if '@apollo/client/react' in content:
                content = content.replace("'@apollo/client/react'", "'@apollo/client'")
                content = content.replace('"@apollo/client/react"', '"@apollo/client"')
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
print('Done!')
