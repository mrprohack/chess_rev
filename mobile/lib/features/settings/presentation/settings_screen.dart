import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_cache.dart';
import 'settings_controller.dart';
import 'widgets/settings_section.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(settingsProvider);
    final controller = ref.read(settingsProvider.notifier);
    return SafeArea(
      child: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Settings',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
            ),
            SettingsSection(
              title: 'Profile',
              children: [
                TextFormField(
                  key: ValueKey(settings.chessComUsername),
                  initialValue: settings.chessComUsername,
                  decoration: const InputDecoration(
                    labelText: 'Chess.com username',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: controller.setChessComUsername,
                ),
              ],
            ),
            SettingsSection(
              title: 'Board',
              children: [
                SwitchListTile(
                  title: const Text('Coordinates'),
                  value: settings.showCoordinates,
                  onChanged: controller.setShowCoordinates,
                ),
                SwitchListTile(
                  title: const Text('Best-move arrows'),
                  value: settings.showArrows,
                  onChanged: controller.setShowArrows,
                ),
                ListTile(
                  title: const Text('Board theme'),
                  trailing: DropdownButton<String>(
                    value: settings.boardTheme,
                    items: const [
                      DropdownMenuItem(value: 'wood', child: Text('Wood')),
                      DropdownMenuItem(value: 'green', child: Text('Green')),
                      DropdownMenuItem(value: 'blue', child: Text('Blue')),
                    ],
                    onChanged: (value) {
                      if (value != null) controller.setBoardTheme(value);
                    },
                  ),
                ),
              ],
            ),
            SettingsSection(
              title: 'Analysis',
              children: [
                ListTile(
                  title: const Text('Engine'),
                  trailing: DropdownButton<String>(
                    value: settings.engine,
                    items: const [
                      DropdownMenuItem(value: 'stockfish18', child: Text('Stockfish 18')),
                      DropdownMenuItem(value: 'stockfish18lite', child: Text('Stockfish 18 Lite')),
                      DropdownMenuItem(value: 'torch4', child: Text('Torch 4')),
                      DropdownMenuItem(value: 'torch4lite', child: Text('Torch 4 Lite')),
                    ],
                    onChanged: (value) {
                      if (value != null) controller.setEngine(value);
                    },
                  ),
                ),
                _SliderSetting(
                  label: 'Depth',
                  value: settings.engineDepth.toDouble(),
                  min: 6,
                  max: 24,
                  divisions: 18,
                  onChanged: (value) => controller.setEngineDepth(value.round()),
                ),
                _SliderSetting(
                  label: 'Maximum time',
                  value: settings.maxTime.toDouble(),
                  min: 1,
                  max: 15,
                  divisions: 14,
                  onChanged: (value) => controller.setMaxTime(value.round()),
                ),
              ],
            ),
            SettingsSection(
              title: 'Playback',
              children: [
                SwitchListTile(
                  title: const Text('Move sounds'),
                  value: settings.soundEnabled,
                  onChanged: controller.setSoundEnabled,
                ),
                _SliderSetting(
                  label: 'Sound volume',
                  value: settings.soundVolume,
                  min: 0,
                  max: 1,
                  divisions: 10,
                  onChanged: controller.setSoundVolume,
                ),
                _SliderSetting(
                  label: 'Autoplay speed',
                  value: settings.autoPlaySpeedMs.toDouble(),
                  min: 400,
                  max: 2000,
                  divisions: 8,
                  onChanged: (value) => controller.setAutoPlaySpeed(value.round()),
                ),
                SwitchListTile(
                  title: const Text('Figurine notation'),
                  value: settings.figurineNotation,
                  onChanged: controller.setFigurineNotation,
                ),
              ],
            ),
            SettingsSection(
              title: 'Appearance',
              children: [
                ListTile(
                  title: const Text('Theme'),
                  trailing: DropdownButton<String>(
                    value: settings.theme,
                    items: const [
                      DropdownMenuItem(value: 'dark', child: Text('Dark')),
                      DropdownMenuItem(value: 'light', child: Text('Light')),
                      DropdownMenuItem(value: 'system', child: Text('System')),
                    ],
                    onChanged: (value) {
                      if (value != null) controller.setTheme(value);
                    },
                  ),
                ),
              ],
            ),
            SettingsSection(
              title: 'Accessibility',
              children: [
                SwitchListTile(
                  title: const Text('Reduce Motion'),
                  subtitle: const Text('Removes decorative board effects.'),
                  value: settings.reduceMotion,
                  onChanged: controller.setReduceMotion,
                ),
              ],
            ),
            SettingsSection(
              title: 'Local Data',
              children: [
                ListTile(
                  title: const Text('Clear saved profile'),
                  trailing: const Icon(Icons.delete_outline),
                  onTap: () => _confirm(
                    context,
                    'Clear saved profile?',
                    ref.read(localCacheProvider).clearProfile,
                  ),
                ),
                ListTile(
                  title: const Text('Clear bookmarks'),
                  trailing: const Icon(Icons.bookmark_remove_outlined),
                  onTap: () => _confirm(
                    context,
                    'Clear all bookmarks?',
                    ref.read(localCacheProvider).clearBookmarks,
                  ),
                ),
                ListTile(
                  title: const Text('Clear recent URLs'),
                  trailing: const Icon(Icons.history_toggle_off),
                  onTap: () => _confirm(
                    context,
                    'Clear recent URLs?',
                    ref.read(localCacheProvider).clearRecentUrls,
                  ),
                ),
                ListTile(
                  title: const Text('Reset settings'),
                  trailing: const Icon(Icons.restart_alt),
                  onTap: () => _confirm(
                    context,
                    'Reset all settings?',
                    controller.reset,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Future<void> _confirm(
    BuildContext context,
    String message,
    Future<void> Function() action,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (confirmed == true) await action();
  }
}

class _SliderSetting extends StatelessWidget {
  const _SliderSetting({
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
    this.divisions,
  });

  final String label;
  final double value;
  final double min;
  final double max;
  final int? divisions;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text('$label: ${value.toStringAsFixed(value % 1 == 0 ? 0 : 1)}'),
        ),
        Slider(
          value: value.clamp(min, max),
          min: min,
          max: max,
          divisions: divisions,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
