# Regenerates src/content/days/index.ts from the dayNN.ts files present.
import os, re
here = os.path.join(os.path.dirname(__file__), '..', 'src', 'content', 'days')
days = sorted(int(f[3:5]) for f in os.listdir(here) if re.fullmatch(r'day\d\d\.ts', f))
out = ["import type { DayModule } from '../../types/content';"]
out += [f"import d{d:02d} from './day{d:02d}';" for d in days]
out += ['', f"export const DAY_MODULES: DayModule[] = [{', '.join(f'd{d:02d}' for d in days)}];", '']
open(os.path.join(here, 'index.ts'), 'w').write('\n'.join(out))
