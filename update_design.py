#!/usr/bin/env python3
"""
Spotify Design System updater for the counseling app
Updates Tailwind className usage according to DESIGN.md rules
"""
import os
import re
from pathlib import Path

# Mapping rules for class name replacements
REPLACEMENTS = [
    # Background colors
    ('bg-background', 'bg-dark-base'),
    ('bg-white', 'bg-dark-surface'),
    ('bg-muted', 'bg-dark-elevated'),
    
    # Text colors
    ('text-foreground', 'text-base'),
    ('text-foreground/60', 'text-secondary'),
    ('text-foreground/70', 'text-secondary'),
    ('text-foreground/80', 'text-secondary'),
    ('text-foreground/50', 'text-secondary'),
    ('text-foreground/40', 'text-tertiary'),
    ('text-foreground/30', 'text-tertiary'),
    
    # Border colors
    ('border-border', 'border-dark'),
    
    # Primary/accent colors
    ('text-primary', 'text-brand-green'),
    ('bg-primary', 'bg-brand-green'),
]

def update_file(filepath):
    """Update a single TSX file with design system replacements"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Apply all replacements
        for old, new in REPLACEMENTS:
            # Use word boundaries to avoid partial matches
            pattern = r'\b' + re.escape(old) + r'\b'
            content = re.sub(pattern, new, content)
        
        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, content.count('\n')
        
        return False, 0
    
    except Exception as e:
        return None, str(e)

def main():
    src_dir = Path('src')
    tsx_files = list(src_dir.rglob('*.tsx'))
    
    updated = 0
    skipped = 0
    errors = 0
    
    print(f"Found {len(tsx_files)} TSX files to process...")
    print("-" * 60)
    
    for filepath in tsx_files:
        result, details = update_file(filepath)
        
        if result is None:
            print(f"❌ ERROR: {filepath}")
            print(f"   {details}")
            errors += 1
        elif result:
            print(f"✅ UPDATED: {filepath}")
            updated += 1
        else:
            skipped += 1
    
    print("-" * 60)
    print(f"\nSummary:")
    print(f"  Updated:  {updated}")
    print(f"  Skipped:  {skipped}")
    print(f"  Errors:   {errors}")
    print(f"  Total:    {len(tsx_files)}")

if __name__ == '__main__':
    main()
